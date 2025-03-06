// backend/server.js
// Main entry point for DriveOpenAI's backend with performance optimizations.

import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';          // Added for response compression
import { check, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import mcache from 'memory-cache';              // Added for memory caching

// Import authentication and route modules
import { oauth2Client, getAuthUrl, handleOAuthCallback, authenticate, refreshAccessToken } from './auth.js';
import driveRoutes from './driveService.js';
import gmailRoutes from './gmailService.js';
import aiRoutes, { 
  buildVectorIndex, 
  getIndexingProgress,
  askAIQuestion, 
  askAIQuestionWithFocus,
  askQuestionStream            // New streaming function
} from './aiService.js';

// Load environment variables from .env file or Firebase config
let fbConfig = {};
try {
  // When running in Firebase Functions
  const functions = require('firebase-functions');
  fbConfig = functions.config();
  logger.info('Loaded environment from Firebase config');
} catch (e) {
  // When running locally, use .env
  dotenv.config();
  logger.info('Loaded environment from .env file');
}

// Access environment variables with fallbacks
const getEnvVar = (name, defaultValue = '') => {
  return process.env[name] || 
    (fbConfig && fbConfig[name.toLowerCase().split('_')[0]] && 
     fbConfig[name.toLowerCase().split('_')[0]][name.toLowerCase().split('_')[1]]) || 
    defaultValue;
};

// Create Express app and set port
const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || fbConfig.app?.port || 3000;

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

// Add compression for faster response times
app.use(compression());

// Use Helmet to secure HTTP headers
app.use(helmet());

// Parse JSON bodies with a size limit
app.use(express.json({ limit: '1mb' }));

// Use Morgan to log HTTP requests in combined format
app.use(morgan('combined'));

// Configure CORS – allow requests from multiple origins
// Fixed CORS to include Firebase domain
const corsOrigins = process.env.CORS_ORIGIN ? 
  process.env.CORS_ORIGIN.split(',') : 
  ['http://localhost:8080', 'https://driveopenai.web.app'];

app.use(cors({
  origin: corsOrigins,
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

// Simple cache middleware
const cache = (duration) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();
    
    const key = '__express__' + req.originalUrl || req.url;
    const cachedBody = mcache.get(key);
    
    if (cachedBody) {
      res.send(cachedBody);
      return;
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        mcache.put(key, body, duration * 1000);
        res.sendResponse(body);
      };
      next();
    }
  };
};

// Performance monitoring middleware to log request duration
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug(`${req.method} ${req.originalUrl} completed in ${duration}ms with status ${res.statusCode}`);
    const MAX_RESPONSE_TIME = Number(getEnvVar('MAX_RESPONSE_TIME_MS', 1000));
    if (duration > MAX_RESPONSE_TIME) {
      logger.warn(`Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });
  next();
});

// Token Refresh Middleware
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

// Authentication Middleware
app.use(authenticate);

// ---------------------------
// Route Definitions
// ---------------------------

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Authentication routes
app.get('/auth/google', (req, res) => {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res, next) => {
  try {
    await handleOAuthCallback(req, res, next);
  } catch (error) {
    logger.error('Error during Google OAuth callback:', error);
    // Use Firebase hosting URL if available
    const frontendUrl = getEnvVar('FRONTEND_URL', 'http://localhost:8080');
    res.redirect(`${frontendUrl}?auth=error&message=${encodeURIComponent(error.message)}`);
  }
});

// Token update endpoint
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

// Auth status endpoint - with caching
app.get('/auth/status', cache(30), (req, res) => {
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

// Drive endpoints - Apply caching to file list
app.use('/api/files', driveRoutes);

// Gmail endpoints
app.use('/api/emails', gmailRoutes);

// AI endpoints
app.use('/api/ai-query', aiRoutes);

// ---------------------------
// NEW RAG, Streaming and Conversation Endpoints
// ---------------------------

// New streaming AI endpoint
app.post('/api/ai-query/stream', [
  check('question').notEmpty().withMessage('Question is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { question } = req.body;
    await askQuestionStream(question, res);
    // Response is handled inside the streaming function
  } catch (error) {
    logger.error('Error with streaming AI query:', error);
    // For streaming errors, we need to send in the correct format
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

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
    const userId = req.headers['x-user-id'] || 'default';
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
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
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
// Start the Server (only when not in Firebase Functions)
// ---------------------------
// Check if this file is being run directly (not as a module)
if (process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_CONFIG) {
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
}

// Export the app for Firebase Functions and testing purposes
export default app;