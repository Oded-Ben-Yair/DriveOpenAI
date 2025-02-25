// driveService.js
import { google } from 'googleapis';
import { oauth2Client } from './auth.js';

export async function listFiles({ limit = 10, offset = 0 } = {}) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const response = await drive.files.list({
    pageSize: limit,
    pageToken: offset || undefined,
    fields: 'nextPageToken, files(id, name, owners, modifiedTime, size)',
  });
  return response.data;
}