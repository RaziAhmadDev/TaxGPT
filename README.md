# Project Title

## Description
This project is a full-stack application utilizing modern web technologies for efficient data handling and user interactions. It includes a backend service that interfaces with external APIs like Pinecone and OpenAI, and a frontend service built with Next.js.

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
     NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
     ```
   This will set the base URL for your API when the frontend makes requests to the backend.

2. **Environment Variables for the Backend:**
   - In the root directory, create a file named `.env`.
   - Add the following content to the `.env` file:
     ```
     PINECONE_API_KEY=<Your SK>
     OPENAI_API_KEY=<Your SK>
     ```
   Replace `<Your SK>` with your actual API keys from Pinecone and OpenAI.

### Running the Application

- Open a terminal and navigate to the root directory of the project where the `docker-compose.yml` file is located.
- Run the following command to start all services:
  ```bash
  docker-compose up
