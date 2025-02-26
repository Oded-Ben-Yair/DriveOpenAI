// server.js
import cors from 'cors';
import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';

import { oauth2Client } from './auth.js';
import {
  listFiles,
  createFile,
  getFileById,
  updateFile,
  deleteFile,
} from './driveService.js';
import { askQuestion } from './aiService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// Middleware: Parse JSON bodies
app.use(express.json());

// Health-check endpoint
app.get('/health', (req, res) => res.status(200).send('OK'));

/**
 * Authentication middleware:
 * Skip for any route starting with "/auth".
 * For other routes, check if oauth2Client has valid credentials.
 */
app.use((req, res, next) => {
  if (req.path.startsWith('/auth')) {
    return next();
  }
  if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
    return res.status(401).json({
      error: 'Not authenticated. Please visit /auth/google to authenticate.',
    });
  }
  next();
});

/**
 * OAuth Flow:
 * GET /auth/google -> Redirect user to Google for authentication.
 */
app.get('/auth/google', (req, res) => {
  const scopes = ['https://www.googleapis.com/auth/drive']; // Full drive access for CRUD
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  res.redirect(url);
});

/**
 * OAuth Callback:
 * GET /auth/google/callback -> Exchange code for tokens.
 */
app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('No code provided by Google.');
  }
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.send(`
      <h2>Authentication successful!</h2>
      <p>You can close this window and return to your app.</p>
    `);
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).send('Failed to get token from Google');
  }
});

/**
 * GET /api/files:
 * List files from Google Drive with pagination.
 */
app.get('/api/files', async (req, res) => {
  try {
    const { limit = 10, offset = null } = req.query;
    const files = await listFiles({ limit: Number(limit), offset });
    res.status(200).json(files);
  } catch (error) {
    console.error('Error in /api/files:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/files:
 * Create a new text file.
 */
app.post('/api/files', async (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name) return res.status(400).json({ error: 'File name required' });
    const newFile = await createFile({ name, content });
    res.status(201).json(newFile);
  } catch (error) {
    console.error('Error in POST /api/files:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/files/:id:
 * Retrieve a single file by ID.
 */
app.get('/api/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await getFileById(fileId);
    res.status(200).json(file);
  } catch (error) {
    console.error('Error in GET /api/files/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/files/:id:
 * Update (e.g., rename) a file.
 */
app.put('/api/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const updatedData = req.body;
    const updatedFile = await updateFile(fileId, updatedData);
    res.status(200).json(updatedFile);
  } catch (error) {
    console.error('Error in PUT /api/files/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/files/:id:
 * Delete a file.
 */
app.delete('/api/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    await deleteFile(fileId);
    res.sendStatus(204);
  } catch (error) {
    console.error('Error in DELETE /api/files/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai-query:
 * Get an AI-generated answer.
 */
app.post('/api/ai-query', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question required' });
    const answer = await askQuestion(question);
    res.status(200).json({ answer });
  } catch (error) {
    console.error('Error in /api/ai-query:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
