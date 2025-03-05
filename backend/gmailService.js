// backend/gmailService.js
import { google } from 'googleapis';
import { oauth2Client } from './auth.js';
import express from 'express';
import logger from './logger.js';
import { retryWithBackoff } from './utils.js';

const router = express.Router();

// List messages in user's Gmail inbox
router.get('/', async (req, res) => {
  try {
    const { maxResults = 10, query = '' } = req.query;
    const emails = await listEmails({ maxResults: Number(maxResults), query });
    res.status(200).json(emails);
  } catch (error) {
    logger.error('Error listing emails:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific email by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const email = await getEmailById(id);
    res.status(200).json(email);
  } catch (error) {
    logger.error('Error getting email:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * List emails from Gmail with optional query
 * @param {Object} options - Options object
 * @param {number} [options.maxResults=10] - Maximum number of results
 * @param {string} [options.query=''] - Search query
 * @returns {Promise<Object>} - List of emails with pagination token
 */
export async function listEmails({ maxResults = 10, query = '' } = {}) {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  try {
    const response = await retryWithBackoff(() => gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: query
    }));
    
    const messages = response.data.messages || [];
    const emails = [];
    
    // Fetch details for each message
    for (const message of messages) {
      const emailData = await retryWithBackoff(() => gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date']
      }));
      
      const headers = emailData.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      
      emails.push({
        id: message.id,
        subject,
        from,
        date,
        snippet: emailData.data.snippet
      });
    }
    
    return {
      emails,
      nextPageToken: response.data.nextPageToken
    };
  } catch (error) {
    logger.error('Error fetching emails:', error);
    throw error;
  }
}

/**
 * Get email by ID
 * @param {string} messageId - Gmail message ID
 * @returns {Promise<Object>} - Email details
 */
export async function getEmailById(messageId) {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  try {
    const response = await retryWithBackoff(() => gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    }));
    
    const message = response.data;
    const headers = message.payload.headers;
    
    // Extract common headers
    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
    const to = headers.find(h => h.name === 'To')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';
    
    // Extract body text
    let bodyText = extractBodyText(message.payload);
    
    return {
      id: messageId,
      subject,
      from,
      to,
      date,
      body: bodyText,
      snippet: message.snippet
    };
  } catch (error) {
    logger.error(`Error fetching email ${messageId}:`, error);
    throw error;
  }
}

/**
 * Extract text from email payload
 * @param {Object} payload - Gmail message payload
 * @returns {string} - Extracted text
 */
function extractBodyText(payload) {
  if (!payload) return '';
  
  // Check for plain text in the payload body
  if (payload.mimeType === 'text/plain' && payload.body && payload.body.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  
  // Check for HTML in the payload body (fallback)
  if (payload.mimeType === 'text/html' && payload.body && payload.body.data) {
    // In a more advanced version, you could convert HTML to plain text
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  
  // Check for parts (multipart emails)
  if (payload.parts && payload.parts.length) {
    // First try to find a text/plain part
    const plainTextPart = payload.parts.find(part => part.mimeType === 'text/plain');
    if (plainTextPart && plainTextPart.body && plainTextPart.body.data) {
      return Buffer.from(plainTextPart.body.data, 'base64').toString('utf-8');
    }
    
    // If no plain text, try HTML part
    const htmlPart = payload.parts.find(part => part.mimeType === 'text/html');
    if (htmlPart && htmlPart.body && htmlPart.body.data) {
      return Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
    }
    
    // Check for nested parts recursively
    for (const part of payload.parts) {
      if (part.parts) {
        const text = extractBodyText(part);
        if (text) return text;
      }
    }
  }
  
  return '(No text content found)';
}

// Export the router as default
export default router;