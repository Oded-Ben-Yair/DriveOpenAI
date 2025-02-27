// server.js - Full updated version
import express from 'express';
import { oauth2Client, getAuthUrl, getToken } from './auth.js';
import { listFiles, getFileById, deleteFile, updateFile } from './driveService.js';
import { listEmails } from './gmailService.js';
import { askQuestion } from './aiService.js';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { check, validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Apply rate limiting to all API requests
app.use('/api/', apiLimiter);

// Middleware to set token from headers
app.use((req, res, next) => {
  const token = req.headers['x-google-token'];
  
  if (token) {
    try {
      // Parse and set the token
      const tokenObj = JSON.parse(token);
      oauth2Client.setCredentials(tokenObj);
    } catch (error) {
      console.error('Error parsing token from headers:', error);
      // Continue anyway
    }
  }
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => res.status(200).send('OK'));

// Authentication endpoints
app.get('/auth/google', (req, res) => {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const tokens = await getToken(code);
    
    // Store tokens in a file for future use
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log('Token stored to', TOKEN_PATH);
    
    // In a real app, you would store tokens in the user's session
    res.redirect(`http://localhost:8080?auth=success&token=${encodeURIComponent(JSON.stringify(tokens))}`);
  } catch (error) {
    console.error('Error during authentication:', error);
    res.redirect(`http://localhost:8080?auth=error&message=${encodeURIComponent(error.message)}`);
  }
});

// Route to refresh or set token
app.post('/auth/token', express.json(), async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  
  try {
    // Set the token in oauth2Client
    oauth2Client.setCredentials(token);
    
    // Also save to file
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error setting token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple route to check auth status
app.get('/auth/status', (req, res) => {
  try {
    // If credentials exist and are valid
    if (oauth2Client.credentials && oauth2Client.credentials.access_token) {
      res.json({ 
        authenticated: true,
        // Don't send the actual tokens to the frontend for security
        // Just confirm they exist
        hasAccessToken: true,
        hasRefreshToken: !!oauth2Client.credentials.refresh_token
      });
    } else {
      res.json({ authenticated: false });
    }
  } catch (error) {
    res.json({ authenticated: false, error: error.message });
  }
});

// Drive API endpoints
app.get('/api/files', [
  check('limit').optional().isInt({ min: 1, max: 100 }),
  check('offset').optional().isString(),
  check('modifiedAfter').optional().isISO8601(),
  check('modifiedBefore').optional().isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { limit, offset, modifiedAfter, modifiedBefore } = req.query;
    const data = await listFiles({ 
      limit: Number(limit) || 10, 
      offset,
      modifiedAfter,
      modifiedBefore
    });
    res.status(200).json(data);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const file = await getFileById(id);
    res.status(200).json(file);
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteFile(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/files/:id', [
  check('name').optional().isString(),
  check('description').optional().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const metadata = {};
    
    if (name) metadata.name = name;
    if (description) metadata.description = description;
    
    const updatedFile = await updateFile(id, metadata);
    res.status(200).json(updatedFile);
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Gmail API endpoint
app.get('/api/emails', [
  check('maxResults').optional().isInt({ min: 1, max: 100 }),
  check('query').optional().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { maxResults, query } = req.query;
    const data = await listEmails({ 
      maxResults: Number(maxResults) || 10,
      query: query || ''
    });
    res.status(200).json(data);
  } catch (error) {
    console.error('Error listing emails:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI query endpoint
app.post('/api/ai-query', [
  check('question').notEmpty().withMessage('Question is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { question } = req.body;
    const answer = await askQuestion(question);
    res.status(200).json({ answer });
  } catch (error) {
    console.error('Error with AI query:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
if (process.argv[1] === new URL(import.meta.url).pathname) {
  // Check if we already have stored credentials and load them
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      oauth2Client.setCredentials(token);
      console.log('Using saved credentials from token.json');
    } else {
      console.log('No stored credentials found. Authentication will be required.');
    }
  } catch (error) {
    console.error('Error loading stored credentials:', error);
  }
  
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;