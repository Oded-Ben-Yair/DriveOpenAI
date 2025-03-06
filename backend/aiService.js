// backend/aiService.js
// This file contains AI helper functions for DriveOpenAI.
// It implements functions for obtaining embeddings with caching and normalization,
// performing semantic search over an in‑memory vector index, building the index from Drive files,
// and generating AI answers (using Retrieval‑Augmented Generation).
// Now with conversation memory and focused document search.

import dotenv from 'dotenv';
import OpenAI from 'openai';
import express from 'express';
import { check, validationResult } from 'express-validator';
import { listAndIndexFiles, getFileContent } from './driveService.js';
import logger from './logger.js';
import { chunkText, cosineSimilarity, retryWithBackoff } from './utils.js';

// Create router for AI routes
const router = express.Router();

dotenv.config();

// Initialize OpenAI client using the API key from environment variables.
const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey });

// Retrieve model names from environment variables.
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-ada-002';
const COMPLETION_MODEL = process.env.COMPLETION_MODEL || 'gpt-3.5-turbo'; // Fallback if not provided

logger.info(`Using embedding model: ${EMBEDDING_MODEL}`);
logger.info(`Using completion model: ${COMPLETION_MODEL}`);

// Maximum number of document chunks to include in the context for answering a query.
const MAX_CONTEXT_CHUNKS = 4;

// In-memory vector index to store document chunks along with their embeddings.
let vectorIndex = [];

// Flags to control indexing process.
let isIndexing = false;
let lastIndexTime = 0;
const INDEX_TTL_MS = 60 * 60 * 1000; // 1 hour TTL for the vector index

// In-memory cache for text embeddings (keyed by normalized text).
const EMBEDDING_CACHE = new Map();

// In-memory store for conversations.
const conversations = new Map();

/**
 * Create a new conversation.
 * @param {string} userId - The user ID to associate with the conversation.
 * @returns {string} The conversation ID.
 */
export function createConversation(userId) {
  const conversationId = `${userId}-${Date.now()}`;
  conversations.set(conversationId, {
    id: conversationId,
    userId,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  logger.info(`Created new conversation: ${conversationId} for user: ${userId}`);
  return conversationId;
}

/**
 * Add a message to a conversation.
 * @param {string} conversationId - The conversation ID.
 * @param {Object} message - The message to add with role and content.
 * @returns {Object} The updated conversation.
 */
export function addMessage(conversationId, message) {
  const conversation = conversations.get(conversationId);
  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }
  conversation.messages.push({
    ...message,
    timestamp: new Date().toISOString()
  });
  conversation.updatedAt = new Date().toISOString();
  return conversation;
}

/**
 * Get a conversation by ID.
 * @param {string} conversationId - The conversation ID.
 * @returns {Object|undefined} The conversation or undefined if not found.
 */
export function getConversation(conversationId) {
  return conversations.get(conversationId);
}

/**
 * Get all conversations for a user.
 * @param {string} userId - The user ID.
 * @returns {Array<Object>} Array of conversations.
 */
export function getUserConversations(userId) {
  const userConversations = [];
  for (const conversation of conversations.values()) {
    if (conversation.userId === userId) {
      userConversations.push(conversation);
    }
  }
  return userConversations;
}

/**
 * Delete a conversation.
 * @param {string} conversationId - The conversation ID.
 * @returns {boolean} True if deleted, false otherwise.
 */
export function deleteConversation(conversationId) {
  return conversations.delete(conversationId);
}

/**
 * Get embedding for text using OpenAI's API.
 * Includes normalization, caching, token truncation, and retry logic.
 *
 * @param {string} text - Text to embed.
 * @returns {Promise<Array<number>>} - The embedding vector.
 */
export async function getEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    logger.warn('Attempted to get embedding for empty or invalid text');
    return new Array(1536).fill(0);
  }
  // Normalize text: trim, reduce whitespace, and convert to lowercase.
  let normalizedText = text.trim().replace(/\s+/g, ' ').toLowerCase();
  // Truncate if too long to avoid token limit issues.
  if (normalizedText.length > 8000) {
    logger.debug(`Truncating long text (${normalizedText.length} chars) for embedding`);
    normalizedText = normalizedText.substring(0, 8000);
  }
  // Check cache.
  if (EMBEDDING_CACHE.has(normalizedText)) {
    return EMBEDDING_CACHE.get(normalizedText);
  }
  try {
    const response = await retryWithBackoff(() =>
      openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: normalizedText
      })
    );
    const embedding = response.data[0].embedding;
    EMBEDDING_CACHE.set(normalizedText, embedding);
    return embedding;
  } catch (error) {
    logger.error(`Error generating embedding: ${error.message}`);
    return new Array(1536).fill(0);
  }
}

/**
 * Perform semantic search over the vector index.
 *
 * @param {string} query - The user query.
 * @param {number} [topK=3] - Maximum number of top results to return.
 * @param {Array<string>} [documentIds=[]] - Optional array of document IDs to focus search on.
 * @returns {Promise<Array>} - Array of matching chunks with similarity scores.
 */
export async function semanticSearch(query, topK = 3, documentIds = []) {
  try {
    if (vectorIndex.length === 0) {
      logger.warn('No documents in vector index. Returning empty results.');
      return [];
    }
    const queryEmbedding = await getEmbedding(query);
    let searchableIndex = vectorIndex;
    if (documentIds && documentIds.length > 0) {
      searchableIndex = vectorIndex.filter(item => documentIds.includes(item.fileId));
      logger.info(`Focusing search on ${searchableIndex.length} chunks from ${documentIds.length} selected documents`);
    }
    const scoredChunks = searchableIndex.map(item => {
      const score = cosineSimilarity(queryEmbedding, item.embedding);
      return { ...item, score };
    });
    scoredChunks.sort((a, b) => b.score - a.score);
    const filteredChunks = scoredChunks.filter(chunk => chunk.score > 0.3).slice(0, topK);
    return filteredChunks;
  } catch (error) {
    logger.error(`Error in semantic search: ${error.message}`);
    return [];
  }
}

/**
 * Helper function to determine if content is unusable.
 *
 * @param {string} content - The text content to check.
 * @returns {boolean} - True if content is considered error/placeholder.
 */
function isErrorContent(content) {
  if (!content || typeof content !== 'string') return true;
  return content.startsWith('[Error') ||
         content.startsWith('[Unsupported') ||
         content.startsWith('[Content unavailable') ||
         content.startsWith('[Image file') ||
         content.startsWith('[Media file') ||
         content.startsWith('[File not downloadable') ||
         content.startsWith('[Google Drive Folder]');
}

/**
 * Build the vector index from Google Drive documents.
 *
 * @param {boolean} [force=false] - Whether to force a rebuild of the index.
 * @returns {Promise<number>} - Number of indexed chunks.
 */
export async function buildVectorIndex(force = false) {
  if (isIndexing) {
    logger.info('Indexing already in progress');
    return -1;
  }
  if (!force && vectorIndex.length > 0 && (Date.now() - lastIndexTime) < INDEX_TTL_MS) {
    logger.info(`Using existing index with ${vectorIndex.length} chunks`);
    return vectorIndex.length;
  }
  try {
    isIndexing = true;
    logger.info('Starting vector index build');
    vectorIndex = [];
    EMBEDDING_CACHE.clear();
    const files = await listAndIndexFiles({ maxFiles: 100 });
    let processedFiles = 0;
    let indexedChunks = 0;
    for (const file of files) {
      try {
        const content = await getFileContent(file.id, file.mimeType);
        if (!content || content.length < 20 || isErrorContent(content)) {
          logger.debug(`Skipping file ${file.id} (${file.name}) - invalid content`);
          continue;
        }
        const chunks = chunkText(content);
        logger.debug(`Processing ${chunks.length} chunks for file ${file.name} (${file.id})`);
        for (const [i, chunk] of chunks.entries()) {
          if (chunk.length < 20 || isErrorContent(chunk)) continue;
          try {
            const embedding = await getEmbedding(chunk);
            if (embedding.every(val => val === 0)) continue;
            vectorIndex.push({
              fileId: file.id,
              fileName: file.name,
              chunkIndex: i,
              chunk,
              embedding
            });
            indexedChunks++;
          } catch (embeddingError) {
            logger.error(`Error generating embedding for chunk in file ${file.id} (${file.name}): ${embeddingError.message}`);
          }
        }
        processedFiles++;
      } catch (error) {
        logger.error(`Error processing file ${file.id} (${file.name}): ${error.message}`);
      }
    }
    lastIndexTime = Date.now();
    logger.info(`Vector index built: ${indexedChunks} chunks indexed from ${processedFiles} files (out of ${files.length} attempted)`);
    return indexedChunks;
  } catch (error) {
    logger.error(`Error building vector index: ${error.message}`);
    return 0;
  } finally {
    isIndexing = false;
  }
}

/**
 * Answer a user query using Retrieval-Augmented Generation (RAG).
 *
 * @param {string} question - The user's query.
 * @param {Array} [conversationHistory=[]] - Array of previous messages.
 * @param {Array<string>} [documentIds=[]] - Optional document IDs for focused search.
 * @returns {Promise<Object>} - Object containing answer and sources.
 */
export async function answerQuery(question, conversationHistory = [], documentIds = []) {
  try {
    logger.info(`Answering query: "${question}"`);
    if (vectorIndex.length === 0) {
      logger.info('Vector index is empty; rebuilding index...');
      const indexSize = await buildVectorIndex();
      if (indexSize <= 0) {
        return {
          answer: "I couldn't find any indexable documents in your Google Drive. They may be in unsupported formats or inaccessible.",
          sources: []
        };
      }
    }
    const relevantChunks = await semanticSearch(question, MAX_CONTEXT_CHUNKS, documentIds);
    if (relevantChunks.length === 0) {
      return {
        answer: "I couldn't find any relevant information in your Drive files to answer that question. Please try a different query.",
        sources: []
      };
    }
    let contextText = "";
    const sources = [];
    for (const item of relevantChunks) {
      if (!isErrorContent(item.chunk)) {
        contextText += `From "${item.fileName}":\n${item.chunk}\n\n---\n\n`;
        if (!sources.some(source => source.fileId === item.fileId)) {
          sources.push({
            fileId: item.fileId,
            fileName: item.fileName
          });
        }
      }
    }
    if (contextText.trim().length === 0) {
      return {
        answer: "I found some relevant files, but could not extract usable content from them.",
        sources: []
      };
    }
    const messages = [
      { 
        role: "system", 
        content: `You are an AI assistant specialized in answering questions about the user's Google Drive documents.
Use only the following excerpts from the documents to answer the query.
If the answer is not found in the provided excerpts, state that clearly.
Always cite the document names when using their content.`
      }
    ];
    const recentHistory = conversationHistory.slice(-5);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });
    messages.push({ 
      role: "user", 
      content: `Document Excerpts:
${contextText}

My question is: "${question}"

Answer:` 
    });
    const completion = await retryWithBackoff(() => openai.chat.completions.create({
      model: COMPLETION_MODEL,
      messages: messages,
      temperature: 0.3,
      max_tokens: 500
    }));
    const answer = completion.choices[0].message.content.trim();
    return { answer, sources };
  } catch (error) {
    logger.error(`Error in answerQuery: ${error.message}`);
    return {
      answer: "I encountered an error while processing your question. Please try again or rephrase your query.",
      sources: []
    };
  }
}

/**
 * Handle special predefined queries.
 *
 * @param {string} question - The user's query.
 * @returns {Promise<string|null>} - Answer string if handled, otherwise null.
 */
export async function handleSpecialQueries(question) {
  if (!question) return null;
  const lowerQuestion = question.toLowerCase();
  if (lowerQuestion.includes('who owns the most files') ||
      lowerQuestion.includes('most recently modified') ||
      lowerQuestion.includes('largest file')) {
    return null;
  }
  return null;
}

/**
 * Main entry point for answering a question.
 *
 * @param {string} question - The user's query.
 * @returns {Promise<string>} - The final answer.
 */
export async function askQuestion(question) {
  try {
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return "I need a question to answer. Please ask something about your documents.";
    }
    const specialAnswer = await handleSpecialQueries(question);
    if (specialAnswer) return specialAnswer;
    const { answer, sources } = await answerQuery(question);
    let formattedAnswer = answer;
    if (sources && sources.length > 0) {
      formattedAnswer += "\n\nSources:\n" + sources.map(src => `- ${src.fileName}`).join("\n");
    }
    return formattedAnswer;
  } catch (error) {
    logger.error(`Error in askQuestion: ${error.message}`, error);
    return "I encountered an error while processing your question. Please try again.";
  }
}

/**
 * Answer a user query with conversation history.
 *
 * @param {string} question - The user's query.
 * @param {string} conversationId - ID of the conversation.
 * @param {string} userId - ID of the user.
 * @returns {Promise<Object>} - Object with answer, sources, and conversationId.
 */
export async function askAIQuestion(question, conversationId = null, userId = 'default') {
  try {
    if (!conversationId) {
      conversationId = createConversation(userId);
    }
    const conversation = getConversation(conversationId) || { messages: [] };
    addMessage(conversationId, { role: 'user', content: question });
    const { answer, sources } = await answerQuery(question, conversation.messages);
    addMessage(conversationId, { role: 'assistant', content: answer });
    return { answer, sources, conversationId };
  } catch (error) {
    logger.error('Error in askAIQuestion:', error);
    throw error;
  }
}

/**
 * Answer a user query focused on specific documents.
 *
 * @param {string} question - The user's query.
 * @param {Array<string>} documentIds - Array of file IDs to focus on.
 * @param {string} conversationId - ID of the conversation.
 * @param {string} userId - ID of the user.
 * @returns {Promise<Object>} - Object with answer, sources, and conversationId.
 */
export async function askAIQuestionWithFocus(question, documentIds, conversationId = null, userId = 'default') {
  try {
    if (!conversationId) {
      conversationId = createConversation(userId);
    }
    const conversation = getConversation(conversationId) || { messages: [] };
    addMessage(conversationId, { role: 'user', content: question });
    const { answer, sources } = await answerQuery(question, conversation.messages, documentIds);
    addMessage(conversationId, { role: 'assistant', content: answer });
    return { answer, sources, conversationId };
  } catch (error) {
    logger.error('Error in askAIQuestionWithFocus:', error);
    throw error;
  }
}

/**
 * Get the current indexing status.
 *
 * @returns {Object} Object with indexing status information.
 */
export function getIndexingProgress() {
  return {
    status: isIndexing ? 'in-progress' : (vectorIndex.length > 0 ? 'completed' : 'idle'),
    processed: vectorIndex.length,
    total: isIndexing ? 0 : vectorIndex.length,
    currentFile: isIndexing ? 'Processing...' : ''
  };
}

// Set up routes for the AI services.
router.post('/', [
  check('question').notEmpty().withMessage('Question is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { question } = req.body;
    const answer = await askQuestion(question);
    res.status(200).json({ answer });
  } catch (error) {
    logger.error('Error with AI query:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/index-build', async (req, res) => {
  try {
    const { force } = req.body;
    buildVectorIndex(force).catch(err => {
      logger.error('Background indexing error:', err);
    });
    res.status(200).json(getIndexingProgress());
  } catch (error) {
    logger.error('Error starting indexing:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/indexing-status', (req, res) => {
  const status = getIndexingProgress();
  res.status(200).json(status);
});

router.post('/conversation', [
  check('question').notEmpty().withMessage('Question is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { question, conversationId } = req.body;
    const userId = req.headers['x-user-id'] || 'default';
    const response = await askAIQuestion(question, conversationId, userId);
    res.status(200).json(response);
  } catch (error) {
    logger.error('Error with AI conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/focused', [
  check('question').notEmpty().withMessage('Question is required'),
  check('documentIds').isArray().withMessage('Document IDs must be an array')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { question, documentIds, conversationId } = req.body;
    const userId = req.headers['x-user-id'] || 'default';
    const response = await askAIQuestionWithFocus(question, documentIds, conversationId, userId);
    res.status(200).json(response);
  } catch (error) {
    logger.error('Error with focused AI query:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

