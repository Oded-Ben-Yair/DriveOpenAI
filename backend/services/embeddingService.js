// backend/services/embeddingService.js
import { OpenAI } from 'openai';
import crypto from 'crypto';
import dotenv from 'dotenv';
// Use your existing cache implementation
import { setCache, getCache } from '../cache.js';
// Use your existing logger
import logger from '../logger.js';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const CACHE_TTL = 86400; // 24 hour cache

// Generate embeddings for text using OpenAI
export async function getEmbedding(text) {
  // Create a cache key (hash of the text)
  const cacheKey = crypto.createHash('md5').update(text).digest('hex');
  
  // Check cache first
  const cachedEmbedding = getCache(`embedding_${cacheKey}`);
  if (cachedEmbedding) {
    return cachedEmbedding;
  }
  
  // Get embedding from OpenAI
  try {
    const response = await openai.embeddings.create({
      model: process.env.EMBEDDING_MODEL || "text-embedding-ada-002",
      input: text
    });
    
    const embedding = response.data[0].embedding;
    
    // Cache the result
    setCache(`embedding_${cacheKey}`, embedding, CACHE_TTL);
    
    return embedding;
  } catch (error) {
    logger.error('Error generating embedding:', error);
    throw error;
  }
}

// Calculate cosine similarity between vectors
export function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}