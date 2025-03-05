import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { google } from 'googleapis';
import { oauth2Client } from '../auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, '../temp');

// Create temp directory if it doesn't exist
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Extract text from a file based on its MIME type.
 *
 * @param {string} fileId - The ID of the file.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {Promise<string>} - The extracted text.
 */
export async function extractTextFromFile(fileId, mimeType) {
  const tempFilePath = path.join(TEMP_DIR, fileId);
  
  try {
    // Download the file to a temporary location.
    await downloadFile(fileId, tempFilePath);
    
    let text = '';
    
    if (mimeType.includes('pdf')) {
      const dataBuffer = fs.readFileSync(tempFilePath);
      const pdfData = await pdf(dataBuffer);
      text = pdfData.text;
    } else if (mimeType.includes('document') || mimeType.includes('docx')) {
      const result = await mammoth.extractRawText({ path: tempFilePath });
      text = result.value;
    } else if (mimeType.includes('text/')) {
      text = fs.readFileSync(tempFilePath, 'utf8');
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      // Basic cell extraction for spreadsheets; simplified implementation.
      text = "Spreadsheet content extraction not fully implemented";
    }
    
    return text;
  } catch (error) {
    logger.error(`Error extracting text from ${fileId}:`, error);
    throw error;
  } finally {
    // Clean up temporary file.
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

/**
 * Helper function to download a file from Google Drive.
 *
 * @param {string} fileId - The ID of the file to download.
 * @param {string} destPath - The destination path to save the file.
 * @returns {Promise<void>} - Resolves when download is complete.
 */
async function downloadFile(fileId, destPath) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  return new Promise((resolve, reject) => {
    drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    )
    .then(res => {
      const dest = fs.createWriteStream(destPath);
      res.data
        .on('end', () => resolve())
        .on('error', err => reject(err))
        .pipe(dest);
    })
    .catch(err => {
      reject(err);
    });
  });
}
