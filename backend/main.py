from fastapi import FastAPI, HTTPException, Header, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx
import json
import os
from typing import List, Optional
from sqlalchemy.orm import Session
from database import SessionLocal, Chat, Message, engine

# Initialize App
app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Dependency
def get_db():
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()

# Pydantic Models
class MessageRequest(BaseModel):
    role: str
    content: str
   
class ChatRequest(BaseModel):
    model: str = "SportSphere"
    messages: list[MessageRequest]
    chat_id: Optional[str] = None 

class CreateChatRequest(BaseModel):
    id: str
    title: str

class UpdateChatRequest(BaseModel):
    title: str

class TitleRequest(BaseModel):
    model: str = "SportSphere"
    message: str

# --- Endpoints ---

@app.get("/api/chats")
def list_chats(db: Session = Depends(get_db)):
    chats = db.query(Chat).all()
    # Format: [{"id": "123", "title": "..."}]
    return [{"id": str(c.id), "title": c.title} for c in chats]

@app.get("/api/chats/{chat_id}")
def get_messages(chat_id: str, db: Session = Depends(get_db)):
    try:
        cid = int(chat_id)
        messages = db.query(Message).filter(Message.chat_id == cid).all()
        return [{"role": m.role, "content": m.content} for m in messages]
    except ValueError:
        return []

@app.post("/api/chats")
def create_chat(req: CreateChatRequest, db: Session = Depends(get_db)):
    try:
        # Use existing ID if provided (frontend generates timestamp ID)
        cid = int(req.id)
        
        # Check if exists
        existing = db.query(Chat).get(cid)
        if existing:
            return {"status": "exists", "id": req.id}
        
        chat = Chat(id=cid, title=req.title)
        db.add(chat)
        db.commit()
        return {"status": "ok", "id": req.id}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

@app.delete("/api/chats/{chat_id}")
def delete_chat(chat_id: str, db: Session = Depends(get_db)):
    try:
        cid = int(chat_id)
        chat = db.query(Chat).get(cid)
        if chat:
            db.delete(chat)
            db.commit()
    except ValueError:
        pass
    return {"status": "deleted"}

@app.put("/api/chats/{chat_id}")
def update_chat(chat_id: str, req: UpdateChatRequest, db: Session = Depends(get_db)):
    try:
        cid = int(chat_id)
        chat = db.query(Chat).get(cid)
        if chat:
            chat.title = req.title
            db.commit()
    except ValueError:
        pass
    return {"status": "updated"}

# --- Streaming Logic ---

async def get_ollama_stream(data, chat_id_int: int):
    full_response = ""
    try:
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", "http://localhost:11434/api/chat", json=data) as r:
                async for line in r.aiter_lines():
                    if line:
                        try:
                            # Ollama sends raw JSON objects, not SSE "data: " lines
                            chunk_data = json.loads(line)
                            chunk_content = chunk_data.get("message", {}).get("content", "")
                            full_response += chunk_content
                        except:
                            pass
                        yield f"data: {line}\n\n"
    finally:
        # Save AI Response
        if full_response and chat_id_int:
            save_ai_message(chat_id_int, full_response)

def save_ai_message(chat_id: int, content: str):
    db = SessionLocal()
    try:
        msg = Message(chat_id=chat_id, role="assistant", content=content)
        db.add(msg)
        db.commit()
    except Exception as e:
        print(f"Error saving AI message: {e}")
    finally:
        db.close()

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    if not req.chat_id:
        raise HTTPException(status_code=400, detail="Chat ID required")
    
    try:
        chat_id_int = int(req.chat_id)
    except ValueError:
        print(f"Invalid Chat ID format: {req.chat_id}")
        raise HTTPException(status_code=400, detail="Invalid Chat ID")

    db = SessionLocal()
    try:
        # Ensure chat exists
        chat = db.query(Chat).get(chat_id_int)
        if not chat:
            chat = Chat(id=chat_id_int, title="New Chat")
            db.add(chat)
            db.commit()
        
        # Save User Message
        if req.messages:
            last_msg = req.messages[-1]
            if last_msg.role == "user":
                msg = Message(chat_id=chat_id_int, role="user", content=last_msg.content)
                db.add(msg)
                db.commit()
                
    except Exception as e:
        print(f"Error in chat preparation: {e}")
    finally:
        db.close()
    
    # Stream
    data = {
        "model": req.model,
        "messages": [{"role": m.role, "content": m.content} for m in req.messages],
        "stream": True
    }
    
    return StreamingResponse(get_ollama_stream(data, chat_id_int), media_type="text/event-stream")

# --- Title Generation ---

TITLE_GENERATION_PROMPT = """You are an expert title generator.
Analyze the user's message and generate a short, specific title (2-6 words).
STRICT RULES:
1. SUMMARIZE the core intent.
2. PLAIN TEXT only. NO quotes.
3. NO generic words.
4. NO greetings.
5. NO dates/times/emojis.
6. RETURN ONLY THE TITLE.
"""

@app.post("/api/generate_title")
async def generate_title_endpoint(req: TitleRequest):
    data = {
        "model": req.model,
        "messages": [
            {"role": "system", "content": TITLE_GENERATION_PROMPT},
            {"role": "user", "content": req.message}
        ],
        "stream": False,
        "options": {"temperature": 0.3}
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.post("http://localhost:11434/api/chat", json=data)
            if r.status_code == 200:
                resp_json = r.json()
                title = resp_json.get("message", {}).get("content", "").strip()
                title = title.replace('"', '').replace("'", "").strip()
                return {"title": title if title else "New Conversation"}
        except Exception as e:
            print(f"Title generation failed: {e}")
            
    return {"title": req.message[:30] + "..."}
