// driveService.js
import { google } from 'googleapis';
import { oauth2Client } from './auth.js';

/**
 * Lists files from Google Drive with pagination.
 * @param {Object} options - Options object with limit and offset (used as pageToken).
 * @returns {Promise<Object>} An object with keys: nextPageToken, files (array).
 */
export async function listFiles({ limit = 10, offset = null } = {}) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const response = await drive.files.list({
    pageSize: limit,
    pageToken: offset || undefined,
    fields: 'nextPageToken, files(id, name, owners, modifiedTime, size)',
  });
  return response.data; // { nextPageToken, files: [...] }
}

/**
 * Retrieves the text content of a file from Google Drive.
 * If the file is not a text file or an error occurs, returns an empty string.
 * @param {string} fileId - The ID of the file.
 * @returns {Promise<string>}
 */
export async function getFileContent(fileId) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  try {
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'text' }
    );
    return response.data;
  } catch (error) {
    console.error(`Error retrieving content for file ${fileId}:`, error.message);
    return '';
  }
}

/**
 * Creates a new text file in Google Drive.
 * @param {Object} param0 - An object with { name, content }.
 * @returns {Promise<Object>} - Newly created file data.
 */
export async function createFile({ name, content = '' }) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const requestBody = { name };
  const media = { mimeType: 'text/plain', body: content };
  const response = await drive.files.create({
    requestBody,
    media,
    fields: 'id, name, modifiedTime, owners, size',
  });
  return response.data;
}

/**
 * Retrieves a file’s metadata by ID.
 * @param {string} fileId - The ID of the file.
 * @returns {Promise<Object>} - The file metadata.
 */
export async function getFileById(fileId) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const response = await drive.files.get({
    fileId,
    fields: 'id, name, owners, modifiedTime, size',
  });
  return response.data;
}

/**
 * Updates a file's metadata (e.g., renaming).
 * @param {string} fileId - The ID of the file.
 * @param {Object} updatedData - The updated metadata, e.g., { name: 'NewName.txt' }.
 * @returns {Promise<Object>} - The updated file data.
 */
export async function updateFile(fileId, updatedData) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const response = await drive.files.update({
    fileId,
    requestBody: updatedData,
    fields: 'id, name, owners, modifiedTime, size',
  });
  return response.data;
}

/**
 * Deletes a file by ID.
 * @param {string} fileId - The ID of the file.
 * @returns {Promise<Object>} - Success confirmation.
 */
export async function deleteFile(fileId) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  await drive.files.delete({ fileId });
  return { success: true };
}
