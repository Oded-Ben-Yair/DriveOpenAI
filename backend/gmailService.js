// gmailService.js
import { google } from 'googleapis';
import { oauth2Client } from './auth.js';

export async function listEmails({ maxResults = 10, query = '' } = {}) {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: query
    });
    
    const messages = response.data.messages || [];
    const emails = [];
    
    // Fetch details for each message
    for (const message of messages) {
      const emailData = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date']
      });
      
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
    console.error('Error fetching emails:', error.message);
    throw error;
  }
}