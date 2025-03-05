// backend/auth.js
import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import { retryWithBackoff } from './utils.js';

dotenv.config();

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.join(__dirname, 'data', 'token.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Check if we have stored credentials and use them
try {
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oauth2Client.setCredentials(token);
    logger.info('Using saved credentials from token.json');
  }
} catch (error) {
  logger.error('Error loading stored credentials:', error);
}

// Scopes we need
const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/gmail.readonly'
];

// Get authorization URL
function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force to get refresh token
  });
}

// Exchange code for tokens
async function getToken(code) {
  try {
    const { tokens } = await retryWithBackoff(() => oauth2Client.getToken(code));
    oauth2Client.setCredentials(tokens);
    
    // Save tokens to file for future use
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    logger.info('Token stored to ' + TOKEN_PATH);
    
    return tokens;
  } catch (error) {
    logger.error('Error getting token:', error);
    throw error;
  }
}

// Force token refresh
async function refreshAccessToken() {
  try {
    if (!oauth2Client.credentials.refresh_token) {
      logger.error('No refresh token available');
      return false;
    }
    
    const { credentials } = await retryWithBackoff(() => oauth2Client.refreshAccessToken());
    oauth2Client.setCredentials(credentials);
    
    // Update stored token
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials));
    logger.info('Access token refreshed and stored');
    
    return true;
  } catch (error) {
    logger.error('Error refreshing access token:', error);
    return false;
  }
}

/**
 * Handle Google OAuth callback to exchange code for tokens
 * and redirect the user with appropriate parameters
 */
async function handleOAuthCallback(req, res, next) {
  try {
    const { code } = req.query;
    
    if (!code) {
      throw new Error('No authorization code provided');
    }
    
    // Exchange code for tokens
    const tokens = await getToken(code);
    
    // Determine where to redirect after successful authentication
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const tokenParam = encodeURIComponent(JSON.stringify(tokens));
    
    // Redirect to frontend with tokens
    res.redirect(`${frontendUrl}?auth=success&token=${tokenParam}`);
  } catch (error) {
    logger.error('OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    res.redirect(`${frontendUrl}?auth=error&message=${encodeURIComponent(error.message)}`);
  }
}

/**
 * Middleware to authenticate requests using tokens.
 * Checks for Authorization header or x-google-token header.
 */
function authenticate(req, res, next) {
  try {
    // Skip for certain paths
    if (req.path === '/health' || 
        req.path === '/auth/google' || 
        req.path.startsWith('/auth/google/callback')) {
      return next();
    }
    
    // Check for token in Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      if (token) {
        try {
          const tokenObj = JSON.parse(token);
          oauth2Client.setCredentials(tokenObj);
        } catch (error) {
          // If token isn't valid JSON, try using it as-is
          oauth2Client.setCredentials({ access_token: token });
        }
      }
    }
    
    // For backward compatibility, also check x-google-token header
    const customToken = req.headers['x-google-token'];
    if (customToken) {
      try {
        const tokenObj = JSON.parse(customToken);
        oauth2Client.setCredentials(tokenObj);
      } catch (error) {
        logger.error('Error parsing token from headers:', error);
      }
    }
    
    // Continue request processing
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    // Continue anyway, the request might not need authentication
    next();
  }
}

export { 
  oauth2Client, 
  getAuthUrl, 
  getToken, 
  refreshAccessToken, 
  handleOAuthCallback, 
  authenticate, 
  SCOPES 
};