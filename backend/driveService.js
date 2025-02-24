// driveService.js
const { google } = require('googleapis');
const { oauth2Client } = require('./auth');

/**
 * List files from Google Drive with pagination.
 * @param {Object} options - { limit, offset }
 * @returns {Promise<Object>} Object with files array and nextPageToken.
 */
async function listFiles({ limit = 10, offset = 0 } = {}) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const response = await drive.files.list({
    pageSize: limit,
    pageToken: offset || undefined,
    fields: 'nextPageToken, files(id, name, owners, modifiedTime, size)',
  });

  return response.data;
}

module.exports = { listFiles };
