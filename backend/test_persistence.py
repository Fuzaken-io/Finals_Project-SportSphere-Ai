import httpx
import asyncio
import json

async def test_persistence():
    url = "http://localhost:8000/api/chat"
    chat_id = "123456"
    payload = {
        "model": "SportSphere",
        "messages": [{"role": "user", "content": "Tell me a very long story about basketball history."}],  
        "stream": True,
        "chat_id": chat_id
    }
    print(f"POST {url}")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("POST", url, json=payload) as resp:
                print(f"Status: {resp.status_code}")
                # Read a few chunks then abort
                count = 0
                async for chunk in resp.aiter_lines():
                    if chunk:
                        # print(f"Chunk: {chunk[:20]}...")
                        count += 1
                        if count > 5:
                            print("Aborting client stream...")
                            # Break loop closes connection context, simulating abort
                            break 
    except Exception as e:
        print(f"Stream interrupted: {e}")

    # Verify persistence
    print("Checking DB for saved message...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"http://localhost:8000/api/chats/{chat_id}")
            print(f"Chat History Status: {resp.status_code}")
            msgs = resp.json()
            if len(msgs) == 2 and msgs[1]['role'] == 'assistant' and len(msgs[1]['content']) > 0:
                print("✅ PASSED: Assistant message saved despite abort!")
                print(f"Saved Content Length: {len(msgs[1]['content'])}")
            else:
                print("❌ FAILED: Assistant message not saved correctly.")
                print(f"Messages found: {msgs}")
    except Exception as e:
        print(f"Verification failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_persistence())
