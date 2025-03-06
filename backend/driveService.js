// backend/driveService.js - Fully Merged and Optimized Version

import { google } from 'googleapis';
import { oauth2Client, refreshAccessToken } from './auth.js';
import mammoth from 'mammoth';
import logger from './logger.js';
import { retryWithBackoff } from './utils.js';
import { extractTextFromPDF } from './patches/pdf-parse-fix.js';
import express from 'express';
import mcache from 'memory-cache';

// Create router for Drive API routes
const router = express.Router();

// In-memory cache
const fileContentCache = new Map();
const FILE_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Initialize drive API
const drive = google.drive({ version: 'v3', auth: oauth2Client });

/**
 * List files with filtering options and proper pagination
 * @param {Object} options - Filter options
 * @param {Number} options.limit - Maximum number of files to return
 * @param {String} options.pageToken - Token for pagination
 * @param {String} options.modifiedAfter - ISO date string for filtering files modified after this date
 * @param {String} options.modifiedBefore - ISO date string for filtering files modified before this date
 * @param {String} options.mimeType - Filter by specific mime type
 * @returns {Promise<Object>} - Files data with nextPageToken
 */
export async function listFiles({ 
  limit = 10, 
  pageToken = null,
  modifiedAfter = null,
  modifiedBefore = null,
  mimeType = null
} = {}) {
  // Build query components
  const queryParts = ['trashed=false'];
  
  if (modifiedAfter) {
    try {
      // Ensure proper date format
      const afterDate = new Date(modifiedAfter);
      if (!isNaN(afterDate.getTime())) {
        queryParts.push(`modifiedTime > '${afterDate.toISOString()}'`);
      } else {
        logger.warn(`Invalid modifiedAfter date: ${modifiedAfter}`);
      }
    } catch (err) {
      logger.error(`Error parsing modifiedAfter date: ${err.message}`);
    }
  }
  
  if (modifiedBefore) {
    try {
      const beforeDate = new Date(modifiedBefore);
      if (!isNaN(beforeDate.getTime())) {
        queryParts.push(`modifiedTime < '${beforeDate.toISOString()}'`);
      } else {
        logger.warn(`Invalid modifiedBefore date: ${modifiedBefore}`);
      }
    } catch (err) {
      logger.error(`Error parsing modifiedBefore date: ${err.message}`);
    }
  }
  
  if (mimeType) {
    queryParts.push(`mimeType='${mimeType}'`);
  }
  
  // Prepare request parameters
  const params = {
    pageSize: Number(limit),
    q: queryParts.join(' and '),
    fields: 'nextPageToken, files(id, name, mimeType, owners, modifiedTime, size, webViewLink, md5Checksum)',
    orderBy: 'modifiedTime desc' // Get most recent files first
  };
  
  // Add pageToken for pagination if provided
  if (pageToken) {
    params.pageToken = pageToken;
  }
  
  logger.debug(`Drive query: ${params.q}`);
  
  try {
    const response = await retryWithBackoff(() => drive.files.list(params));
    return response.data;
  } catch (error) {
    // If token is expired, try to refresh
    if (error.code === 401 && await refreshAccessToken()) {
      // Retry the request with new token
      return listFiles({ limit, pageToken, modifiedAfter, modifiedBefore, mimeType });
    }
    
    logger.error('Error listing files:', error);
    throw new Error(`Failed to list files: ${error.message}`);
  }
}

/**
 * Get file by ID with detailed information
 * @param {String} fileId - Google Drive file ID
 * @returns {Promise<Object>} - File details
 */
export async function getFileById(fileId) {
  // Check cache first
  const cacheKey = `file_${fileId}`;
  const cachedFile = mcache.get(cacheKey);
  if (cachedFile) {
    logger.debug(`Cache hit for file details ${fileId}`);
    return cachedFile;
  }

  try {
    const response = await retryWithBackoff(() => drive.files.get({
      fileId,
      fields: 'id, name, mimeType, owners, modifiedTime, size, webViewLink, description, md5Checksum'
    }));
    
    // Cache the file data for 5 minutes
    mcache.put(cacheKey, response.data, 5 * 60 * 1000);
    return response.data;
  } catch (error) {
    logger.error(`Error getting file ${fileId}:`, error);
    throw error;
  }
}

/**
 * Delete file by ID
 * @param {String} fileId - Google Drive file ID
 * @returns {Promise<void>}
 */
export async function deleteFile(fileId) {
  try {
    await retryWithBackoff(() => drive.files.delete({ fileId }));
    // Also remove from cache if present
    fileContentCache.delete(fileId);
    mcache.del(`file_${fileId}`);
  } catch (error) {
    logger.error(`Error deleting file ${fileId}:`, error);
    throw error;
  }
}

/**
 * Update file metadata
 * @param {String} fileId - Google Drive file ID
 * @param {Object} metadata - New metadata to apply
 * @returns {Promise<Object>} - Updated file
 */
export async function updateFile(fileId, metadata) {
  try {
    const response = await retryWithBackoff(() => drive.files.update({
      fileId,
      requestBody: metadata,
      fields: 'id, name, mimeType, owners, modifiedTime, size, webViewLink, description'
    }));
    
    // Update cache
    mcache.del(`file_${fileId}`);
    return response.data;
  } catch (error) {
    logger.error(`Error updating file ${fileId}:`, error);
    throw error;
  }
}

/**
 * Extract text from a DOCX Buffer
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromDocx(buffer) {
  try {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  } catch (error) {
    logger.error('Error extracting text from DOCX:', error);
    return '[Error extracting DOCX text]'; // More descriptive error message
  }
}

/**
 * Get file content by ID and extract text
 * @param {string} fileId - Google Drive file ID
 * @param {string} [mimeType] - Optional mime type (if known)
 * @returns {Promise<string>} - Extracted text content
 */
export async function getFileContent(fileId, mimeType) {
  // Check cache first
  if (fileContentCache.has(fileId)) {
    const cacheEntry = fileContentCache.get(fileId);
    // If cache is still valid
    if (Date.now() - cacheEntry.timestamp < FILE_CACHE_TTL_MS) {
      logger.debug(`Cache hit for file ${fileId}`);
      return cacheEntry.content;
    }
    // Cache expired, remove entry
    fileContentCache.delete(fileId);
  }
  
  try {
    // If mime type not provided, get file details first
    if (!mimeType) {
      const fileDetails = await getFileById(fileId);
      mimeType = fileDetails.mimeType;
    }
    
    let content = '';
    
    // For Google Docs, Sheets, Slides, etc.
    if (mimeType.startsWith('application/vnd.google-apps')) {
      let exportMime;
      let isExportable = true;
      
      // Choose appropriate export format based on Google Workspace file type
      if (mimeType === 'application/vnd.google-apps.document') {
        exportMime = 'text/plain';
      } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
        exportMime = 'text/csv';
      } else if (mimeType === 'application/vnd.google-apps.presentation') {
        exportMime = 'text/plain';
      } else if (mimeType === 'application/vnd.google-apps.folder') {
        // Folders don't have content to extract
        isExportable = false;
        content = "[Google Drive Folder]";
      } else {
        // Other Google types, try plain text but be prepared for failures
        exportMime = 'text/plain';
      }
      
      if (isExportable) {
        try {
          // Export Google Workspace files
          const response = await retryWithBackoff(() => 
            drive.files.export({ fileId, mimeType: exportMime }, { responseType: 'arraybuffer' })
          );
          
          content = Buffer.from(response.data).toString('utf-8');
        } catch (error) {
          // Handle non-exportable files
          if (error.message && (
              error.message.includes('Export only supports Docs Editors files') ||
              error.message.includes('fileNotExportable')
          )) {
            logger.warn(`File ${fileId} (${mimeType}) is not exportable. Will try downloading directly.`);
            // Try to download directly as a fallback
            try {
              const response = await retryWithBackoff(() => 
                drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' })
              );
              content = Buffer.from(response.data).toString('utf-8');
            } catch (downloadErr) {
              logger.warn(`Failed to download file ${fileId} directly: ${downloadErr.message}`);
              content = `[Content unavailable for ${mimeType}]`;
            }
          } else {
            // For other errors, just log and continue with empty content
            logger.error(`Error exporting Google file ${fileId}: ${error.message}`);
            content = `[Error accessing file content]`;
          }
        }
      }
    } else {
      // For regular files (PDFs, DOCXs, TXTs, etc.)
      try {
        const response = await retryWithBackoff(() => 
          drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' })
        );
        
        const fileBuffer = Buffer.from(response.data);
        
        // Process based on mime type
        if (mimeType === 'application/pdf') {
          content = await extractTextFromPDF(fileBuffer);
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          content = await extractTextFromDocx(fileBuffer);
        } else if (mimeType.startsWith('text/') || mimeType === 'application/json') {
          // Plain text, JSON, etc.
          content = fileBuffer.toString('utf-8');
        } else if (mimeType.includes('image/')) {
          // Image files - we can't extract text
          content = `[Image file: ${mimeType}]`;
        } else if (mimeType.includes('audio/') || mimeType.includes('video/')) {
          // Audio/video files
          content = `[Media file: ${mimeType}]`;
        } else {
          // Other unsupported file types
          logger.warn(`Unsupported file type: ${mimeType} for file ${fileId}`);
          content = `[Unsupported file type: ${mimeType}]`;
        }
      } catch (error) {
        // Handle download errors gracefully
        if (error.message && error.message.includes('Only files with binary content')) {
          logger.warn(`File ${fileId} cannot be downloaded as binary: ${error.message}`);
          content = `[File not downloadable as binary]`;
        } else {
          logger.error(`Error downloading file ${fileId}: ${error.message}`);
          content = `[Error downloading file content]`;
        }
      }
    }
    
    // Cache the content
    fileContentCache.set(fileId, {
      content,
      timestamp: Date.now()
    });
    
    return content;
  } catch (error) {
    logger.error(`Error getting content for file ${fileId}:`, error);
    return `[Error processing file]`; // Don't throw, return an error message instead
  }
}

/**
 * List all files and index their content
 * @param {object} options - Filter options
 * @param {number} [options.maxFiles=100] - Maximum number of files to index
 * @returns {Promise<Array>} - List of processed files
 */
export async function listAndIndexFiles(options = { maxFiles: 100 }) {
  const indexableFiles = [];
  let pageToken = null;
  let totalFiles = 0;
  
  try {
    do {
      const response = await listFiles({ 
        limit: 50,
        pageToken: pageToken
      });
      
      // Filter files that we can extract text from
      const files = response.files.filter(file => {
        // Skip large binary files we know we can't process
        if (file.mimeType.includes('image/') || 
            file.mimeType.includes('audio/') || 
            file.mimeType.includes('video/') ||
            file.mimeType.includes('application/zip') ||
            file.mimeType.includes('application/x-zip')) {
          return false;
        }
        
        // Include text-based files and known processable types
        return file.mimeType.startsWith('text/') || 
               file.mimeType.includes('pdf') || 
               file.mimeType.includes('document') ||
               file.mimeType.startsWith('application/vnd.google-apps') ||
               file.mimeType.includes('json') ||
               file.mimeType.includes('xml') ||
               file.mimeType.includes('csv');
      });
      
      indexableFiles.push(...files);
      pageToken = response.nextPageToken;
      totalFiles += files.length;
      
      // Stop if we've reached the max files limit
      if (totalFiles >= options.maxFiles) {
        break;
      }
    } while (pageToken);
    
    logger.info(`Found ${indexableFiles.length} indexable files`);
    return indexableFiles;
  } catch (error) {
    logger.error('Error listing and indexing files:', error);
    throw error;
  }
}

// Set up Drive API routes
router.get('/', async (req, res) => {
  try {
    const { limit, pageToken, modifiedAfter, modifiedBefore, mimeType } = req.query;
    const data = await listFiles({ 
      limit: Number(limit) || 10, 
      pageToken: pageToken || null,
      modifiedAfter,
      modifiedBefore,
      mimeType
    });
    res.status(200).json(data);
  } catch (error) {
    logger.error('Error listing files:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const file = await getFileById(id);
    res.status(200).json(file);
  } catch (error) {
    logger.error('Error getting file:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteFile(id);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const metadata = {};
    
    if (name) metadata.name = name;
    if (description) metadata.description = description;
    
    const updatedFile = await updateFile(id, metadata);
    res.status(200).json(updatedFile);
  } catch (error) {
    logger.error('Error updating file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Make the list function available directly on drive.files
drive.files.listFiles = listFiles;

// Export the router to be used in server.js
export default router;