// server.js
import cors from 'cors';
import express from 'express';
import { listFiles } from './driveService.js';
import { askQuestion } from './aiService.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));

// Middleware: Parse JSON bodies
app.use(express.json());

// Health-check endpoint
app.get('/health', (req, res) => res.status(200).send('OK'));

// GET /api/files: Return files with pagination
app.get('/api/files', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const files = await listFiles({ limit: Number(limit), offset });
    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai-query: Return AI-generated answer
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

// Start server if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
