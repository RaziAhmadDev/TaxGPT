# Tax GPT

## Description
This project is a full-stack application utilizing React/Next, Python Flask, Pinecone, and Open AI. This application allows you to upload your W-2 Forms in PDF Format and ask questions about it from an AI in your browser. You can access this application at this url https://taxgpt-service-qonbqlfqya-el.a.run.app

## Local Development Setup

Follow these steps to set up the project locally:

### Prerequisites
- Docker must be installed on your machine.
- Docker Compose must be installed.

### Configuration

1. **Environment Variables for the Frontend:**
   - Navigate to the `webapp` directory.
   - Create a file named `.env.local`.
   - Add the following content to the `.env.local` file:
     ```
     NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
     ```
   This will set the base URL for your API when the frontend makes requests to the backend.

2. **Environment Variables for the Backend:**
   - Navigate to 'backend' directory, create a file named `.env`.
   - Add the following content to the `.env` file:
     ```
     PINECONE_API_KEY=<Your SK>
     OPENAI_API_KEY=<Your SK>
     MONGO_URI=<Your Mongo Connection String>
     ```
   Replace `<Your SK>` with your actual API keys from Pinecone and OpenAI. If you don't have those, you can request the owner of this repo to provide the keys.

### Running the Application

- Open a terminal and navigate to the root directory of the project where the `docker-compose.yml` file is located.
- Run the following command to start all services:
  ```bash
  docker-compose up
- You can go to signup and sign up a new user which will automatically redirect inside the application, or you can navigate to backend and do
  ```
  chmod +x start_script.sh && ./start_script.sh
  ```
  It will create with email `test@example.com` and password `testpassword`
  
