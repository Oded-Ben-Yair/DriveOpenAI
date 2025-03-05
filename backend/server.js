// backend/server.js
// This is the main entry point for DriveOpenAI's backend.
// It sets up Express with security, logging, rate limiting, authentication,
// and routes for Google Drive, Gmail, and AI endpoints.
// It also loads any stored credentials and starts the server.

import express from 'express';
import helmet from 'helmet';                   // Security middleware: sets HTTP headers
import morgan from 'morgan';                   // HTTP request logging
import cors from 'cors';                       // Cross-origin resource sharing
import rateLimit from 'express-rate-limit';    // Rate limiting middleware
import { check, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';              // Custom logger using Winston

// Import authentication and route modules
import { oauth2Client, getAuthUrl, handleOAuthCallback, authenticate, refreshAccessToken } from './auth.js';
import driveRoutes from './driveService.js';
import gmailRoutes from './gmailService.js';
import aiRoutes, { 
  buildVectorIndex, 
  getIndexingProgress,
  askAIQuestion, 
  askAIQuestionWithFocus 
} from './aiService.js';

// Load environment variables from .env file
dotenv.config();

// Create Express app and set port
const app = express();
const PORT = process.env.PORT || 3000;

// Determine __dirname in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define path for token storage (ensure data directory exists)
const TOKEN_PATH = path.join(__dirname, 'data', 'token.json');
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// ---------------------------
// Middleware Setup
// ---------------------------

// Use Helmet to secure HTTP headers
app.use(helmet());

// Parse JSON bodies with a size limit
app.use(express.json({ limit: '1mb' }));

// Use Morgan to log HTTP requests in combined format
app.use(morgan('combined'));

// Configure CORS – allow requests only from approved origins (e.g., your frontend)
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Apply rate limiting to all routes under /api to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100,                // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', apiLimiter);

// Performance monitoring middleware to log request duration
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug(`${req.method} ${req.originalUrl} completed in ${duration}ms with status ${res.statusCode}`);
    const MAX_RESPONSE_TIME = Number(process.env.MAX_RESPONSE_TIME_MS) || 1000;
    if (duration > MAX_RESPONSE_TIME) {
      logger.warn(`Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });
  next();
});

// Token Refresh Middleware - should come before route handlers
app.use(async (req, res, next) => {
  try {
    if (oauth2Client.credentials?.expiry_date) {
      const now = Date.now();
      // If the token expires in less than 5 minutes, refresh it
      if (oauth2Client.credentials.expiry_date - now < 5 * 60 * 1000) {
        logger.info('Access token is expiring soon; attempting to refresh.');
        await refreshAccessToken();
      }
    }
  } catch (error) {
    logger.error('Error refreshing access token:', error);
  }
  next();
});

// ---------------------------
// Authentication Middleware
// ---------------------------
// Use the standard "Authorization: Bearer <token>" header.
// The "authenticate" middleware verifies the JWT and attaches user credentials.
app.use(authenticate);

// ---------------------------
// Route Definitions
// ---------------------------

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Authentication routes
app.get('/auth/google', (req, res) => {
  // Redirect the user to Google's OAuth 2.0 consent page
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res, next) => {
  // Handle Google OAuth callback: exchange code for tokens and issue a JWT
  try {
    await handleOAuthCallback(req, res, next);
    // The callback handler sends the JWT or sets a secure cookie.
  } catch (error) {
    logger.error('Error during Google OAuth callback:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}?auth=error&message=${encodeURIComponent(error.message)}`);
  }
});

// Token update endpoint: allows client to set new token and save it to disk (for persistence)
app.post('/auth/token', express.json(), async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  try {
    oauth2Client.setCredentials(token);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error setting token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Auth status endpoint: returns whether the server has valid credentials
app.get('/auth/status', (req, res) => {
  try {
    if (oauth2Client.credentials && oauth2Client.credentials.access_token) {
      res.json({
        authenticated: true,
        hasAccessToken: true,
        hasRefreshToken: !!oauth2Client.credentials.refresh_token,
        tokenExpiresAt: oauth2Client.credentials.expiry_date
      });
    } else {
      res.json({ authenticated: false });
    }
  } catch (error) {
    logger.error('Error checking auth status:', error);
    res.json({ authenticated: false, error: error.message });
  }
});

// ---------------------------
// Google API Routes
// ---------------------------

// Drive endpoints
app.use('/api/files', driveRoutes); // Endpoints for file operations

// Gmail endpoints
app.use('/api/emails', gmailRoutes); // Endpoints for email operations

// AI endpoints
app.use('/api/ai-query', aiRoutes);  // Endpoints for AI (RAG functionality)

// ---------------------------
// NEW RAG and Conversation Endpoints
// ---------------------------

// Index building endpoint
app.post('/api/index-build', async (req, res) => {
  try {
    const { force } = req.body;
    // Start indexing asynchronously
    buildVectorIndex(force).catch(err => {
      logger.error('Background indexing error:', err);
    });
    // Return current indexing status immediately
    res.status(200).json(getIndexingProgress());
  } catch (error) {
    logger.error('Error starting indexing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Index status endpoint
app.get('/api/indexing-status', (req, res) => {
  const status = getIndexingProgress();
  res.status(200).json(status);
});

// AI conversation query endpoint
app.post('/api/ai-conversation', [
  check('question').notEmpty().withMessage('Question is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { question, conversationId } = req.body;
    const userId = req.headers['x-user-id'] || 'default'; // Retrieve user ID from auth in production
    const response = await askAIQuestion(question, conversationId, userId);
    res.status(200).json(response);
  } catch (error) {
    logger.error('Error with AI conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI query endpoint with focused documents
app.post('/api/ai-query/focused', [
  check('question').notEmpty().withMessage('Question is required'),
  check('documentIds').isArray().withMessage('Document IDs must be an array')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { question, documentIds, conversationId } = req.body;
    const userId = req.headers['x-user-id'] || 'default';
    const response = await askAIQuestionWithFocus(question, documentIds, conversationId, userId);
    res.status(200).json(response);
  } catch (error) {
    logger.error('Error with focused AI query:', error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------
// Global Error and 404 Handlers
// ---------------------------

// Catch-all 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Resource not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled server error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// ---------------------------
// Load Stored Credentials (if available)
// ---------------------------
try {
  if (fs.existsSync(TOKEN_PATH)) {
    const storedToken = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oauth2Client.setCredentials(storedToken);
    logger.info('Loaded stored credentials from token.json');
  } else {
    logger.warn('No stored credentials found. User authentication required.');
  }
} catch (error) {
  logger.error('Error loading stored credentials:', error);
}

// ---------------------------
// Start the Server
// ---------------------------
app.listen(PORT, () => {
  logger.info(`DriveOpenAI server is running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Please free the port or use a different one.`);
    process.exit(1);
  } else {
    logger.error('Server startup error:', err);
  }
});

// Export the app for testing purposes
export default app;
