// driveService.js - Updated with modified date filtering
import { google } from 'googleapis';
import { oauth2Client } from './auth.js';

export async function listFiles({ 
  limit = 10, 
  offset = 0,
  modifiedAfter = null,
  modifiedBefore = null
} = {}) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  // Build query for date filtering
  let query = '';
  if (modifiedAfter) {
    // Format: 'modifiedTime > "2023-01-01T00:00:00"'
    query += `modifiedTime > "${modifiedAfter}"`;
  }
  
  if (modifiedBefore) {
    if (query) query += ' and ';
    query += `modifiedTime < "${modifiedBefore}"`;
  }
  
  const response = await drive.files.list({
    pageSize: Number(limit),
    pageToken: offset || undefined,
    q: query || undefined,
    fields: 'nextPageToken, files(id, name, mimeType, owners, modifiedTime, size, webViewLink)',
  });
  
  return response.data;
}

export async function getFileById(fileId) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, owners, modifiedTime, size, webViewLink, description',
  });
  
  return response.data;
}

export async function deleteFile(fileId) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  await drive.files.delete({ fileId });
}

export async function updateFile(fileId, metadata) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const response = await drive.files.update({
    fileId,
    requestBody: metadata,
    fields: 'id, name, mimeType, owners, modifiedTime, size, webViewLink, description',
  });
  
  return response.data;
}