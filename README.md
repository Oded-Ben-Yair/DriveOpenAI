# DriveOpenAI

A Node.js and Vue.js application that connects to Google Drive, allows file CRUD operations, and provides an AI-powered Q&A interface based on your Drive file content.

## Setup

### Backend
1. Navigate to the `backend` folder:
   ```
   cd backend
   ```
2. Ensure your `.env` file is in the `backend` folder with the following variables:
   ```
   PORT=3000
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   OPENAI_API_KEY=your_openai_key
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the backend server:
   ```
   npm start
   ```
5. Authenticate by visiting [http://localhost:3000/auth/google](http://localhost:3000/auth/google).

### Frontend
1. Navigate to the `frontend` folder:
   ```
   cd frontend
   npm install
   ```
2. Start the frontend development server:
   ```
   npm run serve
   ```
3. Open [http://localhost:8080](http://localhost:8080) to access the app.

## Features

- **Google Drive Integration**: View, upload, delete, update files.
- **AI Q&A**: Ask questions about your Drive files. The AI retrieves file content summaries to provide context-aware answers.
- **Pagination**: Browse files with real pagination using page tokens.
- **Semantic Search**: (Optional) Future integration with AI embeddings for semantic search.

## Git Workflow

- Use feature branches:
  - `feature/backend-setup` for backend changes.
  - `feature/frontend-setup` for frontend changes.
- Commit changes frequently with clear messages.
- Merge feature branches into `main` after thorough testing.

## Performance & Logging

- The backend caches file data where possible and uses proper error handling with detailed logging.
- Frontend uses Material Design principles for a clean, intuitive UI.

