// backend/utils.js
import logger from './logger.js';

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Number} maxRetries - Maximum number of retries
 * @param {Number} initialDelay - Initial delay in ms
 * @returns {Promise} - Result of the function
 */
export async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 100) {
  let attempt = 0;
  let lastError;

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      attempt++;
      
      if (attempt >= maxRetries) {
        logger.error(`All ${maxRetries} retry attempts failed`, { error: err.message });
        throw err;
      }
      
      const delay = initialDelay * Math.pow(2, attempt - 1);
      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, { error: err.message });
      await new Promise(res => setTimeout(res, delay));
    }
  }
  
  throw lastError;
}

/**
 * Chunks text into smaller pieces
 * @param {String} text - Text to chunk
 * @param {Number} maxLength - Maximum length of each chunk
 * @returns {Array} - Array of text chunks
 */
export function chunkText(text, maxLength = 1000) {
  if (!text) return [];
  
  // Split on paragraphs first
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // If paragraph itself is too long, split into sentences
    if (paragraph.length > maxLength) {
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length + 1 > maxLength) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += ' ' + sentence;
        }
      }
    } else if (currentChunk.length + paragraph.length + 2 > maxLength) {
      // If adding paragraph would exceed max length, start a new chunk
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      // Add paragraph to current chunk
      if (currentChunk) currentChunk += '\n\n';
      currentChunk += paragraph;
    }
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array} vecA - First vector
 * @param {Array} vecB - Second vector
 * @returns {Number} - Cosine similarity (between -1 and 1)
 */
export function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}