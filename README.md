# DriveOpenAI – Your Personal RAG Assistant

**DriveOpenAI** is your personal Retrieval-Augmented Generation (RAG) assistant designed specifically for seamless integration with Google Drive. This powerful tool enables you to ask intuitive, conversational questions about your Google Drive documents and receive precise, context-aware answers powered by OpenAI's advanced GPT-4 model.

## What Makes DriveOpenAI Special?
DriveOpenAI uniquely combines advanced semantic understanding with seamless integration into your Google Drive, empowering you to:

- **Effortlessly search your Drive:** Get precise answers using true semantic search.
- **Leverage conversation memory:** Enjoy natural, context-aware interactions.
- **Focus on specific documents:** Target queries for specific document insights.

## Installation

### Requirements
- Node.js (16+ recommended)
- Docker and Docker Compose (optional for container deployment)

### Local Development Setup
Clone and navigate into the project:

```bash
git clone https://github.com/your-repo/DriveOpenAI.git
cd DriveOpenAI

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Running Locally

Ensure you have a `.env` file set up in your `backend` directory with the required API keys and environment variables:

```env
PORT=3000
GOOGLE_CLIENT_ID=<Your Google Client ID>
GOOGLE_CLIENT_SECRET=YourSecret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
OPENAI_API_KEY=your_openai_api_key
EMBEDDING_MODEL=text-embedding-ada-002
OPENAI_COMPLETION_MODEL=gpt-4
```

### Start Backend & Frontend

```bash
# Backend
cd backend
npm start

# Frontend
cd ../frontend
npm run serve
```

## Docker Deployment

To deploy DriveOpenAI using Docker, use the following command from your project's root directory:

```bash
docker-compose up -d
```

This builds and starts both frontend (accessible at `localhost:8080`) and backend (port 3000).

## Firebase Authentication Setup

Ensure your Firebase Authentication settings are correctly configured:

- **Authorized Redirect URI:** Add your Firebase app's callback URL.
- Ensure the Google OAuth credentials (Client ID & Secret) match your `.env`.

## UX/UI Enhancements Implemented

- **Improved welcome experience:** Clear and engaging introduction highlighting key features.
- **Enhanced error handling:** Intuitive and user-friendly error states with actionable feedback.
- **Simplified filtering & pagination:** User-friendly date filtering and file management.
- **Streamlined AI queries:** Dynamic loading states and clear feedback for indexing and AI interactions.

## Security Best Practices

- Store sensitive credentials in `.env` file (never commit sensitive keys to GitHub).
- Use HTTPS in production environments.
- Regularly rotate your OpenAI and Google API credentials.

## Future Roadmap

- **Enhanced models:** Experimenting with advanced OpenAI models like GPT-4o to improve response quality and speed.
- **Real-time updates:** Instant indexing progress updates and improved user feedback.
- **Enhanced file management:** Batch file indexing and real-time indexing updates.

---

Your DriveOpenAI personal RAG assistant is now ready to transform your Google Drive into a powerful knowledge base, offering fast, context-rich, AI-powered interactions with your files.

