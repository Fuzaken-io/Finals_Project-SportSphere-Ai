# SportSphere

SportSphere is a sports analytics chat application built for my final project. It uses a custom AI model to answer sports-related questions and features a modern web interface.

## Project Contents

- frontend/: Contains the React application code.
- backend/: Contains the Python FastAPI server and database logic.
- backend/Modelfile: The configuration file for the custom AI model (SportSphere).

## Requirements

You will need the following installed:
- Node.js
- Python 3.10 or higher
- Ollama

## Installation and Setup

Follow these steps to run the project locally.

### 1. Set up the AI Model

First, you need to create the custom model in Ollama.

1. Open a terminal and go to the backend folder:
   cd backend

2. Run the create command:
   ollama create SportSphere -f Modelfile

### 2. Run the Backend

1. In the backend folder, install the python libraries:
   pip install fastapi "uvicorn[standard]" sqlalchemy

2. Start the server:
   python -m uvicorn main:app --reload

The backend will start running at http://localhost:8000.

### 3. Run the Frontend

1. Open a new terminal window and go to the frontend folder:
   cd frontend

2. Install the javascript packages:
   npm install

3. Start the application:
   npm run dev

4. Open the link shown in the terminal (usually http://localhost:5173) in your browser.

## Features

- Custom SportSphere model that only talks about sports.
- Saves your chat history automatically.
- Dark mode and Light mode support.
- Ability to rename conversations.
