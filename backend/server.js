import express from 'express';
import { google } from 'googleapis';
import { oauth2Client } from './auth.js';
import { askQuestion } from './aiService.js';
import dotenv from 'dotenv';
import cors from 'cors'; // Add this import

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Enable CORS for frontend (localhost:8080)
app.use(cors({
  origin: 'http://localhost:8080', // Allow requests from Vue dev server
  methods: ['GET', 'POST', 'DELETE'], // Allow these methods
  credentials: true // Allow cookies/auth if needed
}));

app.use(express.json());

app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/api/files', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const response = await drive.files.list({
      pageSize: Number(limit),
      pageToken: offset || undefined,
      fields: 'nextPageToken, files(id, name, owners, modifiedTime, size)',
    });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await drive.files.get({
      fileId: id,
      fields: 'id, name, owners, modifiedTime, size',
    });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await drive.files.delete({ fileId: id });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai-query', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question required' });
    const answer = await askQuestion(question);
    res.status(200).json({ answer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

if (process.argv[1] === new URL(import.meta.url).pathname) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;