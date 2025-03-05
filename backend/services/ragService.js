// backend/services/ragService.js
import { extractTextFromFile } from './documentParserService.js';
import { getEmbedding, cosineSimilarity } from './embeddingService.js';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import logger from '../logger.js';
import { retryWithBackoff } from '../utils.js';

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Store for document chunks and their embeddings
const documentIndex = [];
let indexingProgress = { status: 'idle', processed: 0, total: 0, currentFile: '' };

// Function to chunk text
function chunkText(text, maxChunkSize = 1000) {
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    
    currentChunk += sentence + ' ';
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Index a document
export async function indexDocument(file) {
  try {
    indexingProgress.currentFile = file.name;
    logger.info(`Indexing document: ${file.name} (${file.id})`);
    
    // Extract text from file
    const text = await extractTextFromFile(file.id, file.mimeType);
    
    // Split into chunks
    const chunks = chunkText(text);
    logger.info(`Document ${file.name} split into ${chunks.length} chunks`);
    
    // Process each chunk
    for (const [i, chunk] of chunks.entries()) {
      // Get embedding for chunk
      const embedding = await getEmbedding(chunk);
      
      // Store chunk and embedding
      documentIndex.push({
        fileId: file.id,
        fileName: file.name,
        mimeType: file.mimeType,
        chunk,
        chunkIndex: i,
        embedding
      });
    }
    
    indexingProgress.processed += 1;
    logger.info(`Successfully indexed document: ${file.name}`);
    
    return true;
  } catch (error) {
    logger.error(`Error indexing ${file.name}:`, error);
    return false;
  }
}

// Search the document index
export async function searchDocuments(query, topK = 5, documentIds = []) {
  try {
    // Get embedding for query
    const queryEmbedding = await retryWithBackoff(() => getEmbedding(query));
    
    // Filter by document IDs if provided
    let candidates = documentIndex;
    if (documentIds && documentIds.length > 0) {
      candidates = candidates.filter(doc => documentIds.includes(doc.fileId));
    }
    
    // Calculate similarity scores
    const results = candidates.map(doc => ({
      ...doc,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding)
    }));
    
    // Sort by similarity and take top K
    const topResults = results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
    
    logger.info(`Query "${query}" matched ${topResults.length} chunks`);
    return topResults;
  } catch (error) {
    logger.error('Error searching documents:', error);
    throw error;
  }
}

// Answer a question using RAG
export async function answerQuestion(question, conversationHistory = [], documentIds = []) {
  try {
    // Search for relevant documents
    const relevantDocs = await searchDocuments(question, 5, documentIds);
    
    // Construct context from relevant chunks
    const context = relevantDocs
      .map(doc => `Document: ${doc.fileName}\n\n${doc.chunk}`)
      .join('\n\n---\n\n');
    
    // Prepare conversation history in the format OpenAI expects
    const messages = [
      {
        role: 'system',
        content: `You are a helpful AI assistant that answers questions based on the user's Google Drive documents. 
        Use ONLY the provided document excerpts to answer. If the answer cannot be found in the documents, say so.
        Provide answers in a clear, concise format. For each fact you state, indicate which document it came from.`
      }
    ];
    
    // Add conversation history (limit to last 10 messages)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }
    
    // Add current question with context
    messages.push({
      role: 'user',
      content: `Documents for reference:\n\n${context}\n\nQuestion: ${question}`
    });
    
    // Get response from OpenAI with retries
    const response = await retryWithBackoff(() => {
      return openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      });
    });
    
    return {
      answer: response.choices[0].message.content,
      sources: relevantDocs.map(doc => ({
        fileName: doc.fileName,
        fileId: doc.fileId
      }))
    };
  } catch (error) {
    logger.error('Error answering question:', error);
    throw error;
  }
}

// Get indexing progress
export function getIndexingProgress() {
  return indexingProgress;
}

// Set indexing progress
export function setIndexingProgress(status, total) {
  indexingProgress = {
    ...indexingProgress,
    status,
    total,
    processed: 0
  };
  
  logger.info(`Indexing status updated: ${status}, total: ${total}`);
}

// Clear the index
export function clearIndex() {
  documentIndex.length = 0;
  indexingProgress = { status: 'idle', processed: 0, total: 0, currentFile: '' };
  logger.info('Document index cleared');
}

// Index documents in batches
export async function indexDocumentsInBatches(files, batchSize = 10) {
  try {
    const totalFiles = files.length;
    setIndexingProgress('in-progress', totalFiles);
    
    // Process files in batches
    for (let i = 0; i < totalFiles; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      // Process batch in parallel
      await Promise.all(
        batch.map(async (file) => {
          // Skip files that don't have supported mime types
          if (!isSupportedMimeType(file.mimeType)) {
            indexingProgress.processed += 1;
            return;
          }
          
          // Index the file
          await indexDocument(file);
        })
      );
      
      // Log progress
      logger.info(`Indexed batch ${Math.ceil(i / batchSize) + 1}/${Math.ceil(totalFiles / batchSize)}`);
    }
    
    // Update status to completed
    setIndexingProgress('completed', totalFiles);
    indexingProgress.processed = totalFiles;
    
    return getIndexingProgress();
  } catch (error) {
    logger.error('Error indexing documents in batches:', error);
    setIndexingProgress('error', 0);
    throw error;
  }
}

// Helper function to check if a mime type is supported
function isSupportedMimeType(mimeType) {
  const supportedTypes = [
    'application/pdf',
    'text/plain',
    'application/vnd.google-apps.document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.google-apps.spreadsheet'
  ];
  
  return supportedTypes.some(type => mimeType.includes(type));
}