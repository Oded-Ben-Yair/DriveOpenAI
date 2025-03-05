// backend/aiService.test.js
// Tests for the AI Service functions including getEmbedding, semanticSearch, and answerQuery.
// Mocks the OpenAI client and driveService functions to ensure deterministic behavior.

import { jest } from '@jest/globals';
import { getEmbedding, semanticSearch, answerQuery } from './aiService.js';

// Mock OpenAI client to return a fixed embedding and answer.
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: [0.1, 0.2, 0.3] }]
        })
      },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Mocked AI answer' } }]
          })
        }
      }
    }))
  };
});

// Mock driveService to simulate file listing and content extraction.
jest.mock('./driveService.js', () => ({
  listAndIndexFiles: jest.fn().mockResolvedValue([
    { id: 'file1', name: 'test.txt', mimeType: 'text/plain' }
  ]),
  getFileContent: jest.fn().mockResolvedValue('Test file content for DriveOpenAI')
}));

// Set a global vector index for testing purposes.
global.vectorIndex = [
  {
    fileId: 'file1',
    fileName: 'test.txt',
    chunk: 'Test content with information about RAG.',
    embedding: [0.1, 0.2, 0.3]
  }
];

describe('AI Service with RAG', () => {
  it('should get embedding for text', async () => {
    const embedding = await getEmbedding('test');
    // Expect the mocked embedding to be returned.
    expect(embedding).toEqual([0.1, 0.2, 0.3]);
  });
  
  it('should search for relevant chunks', async () => {
    // Set up a specific vector index for this test.
    global.vectorIndex = [
      {
        fileId: 'file1',
        fileName: 'test1.txt',
        chunk: 'Information about cats',
        embedding: [0.1, 0.2, 0.3]
      },
      {
        fileId: 'file2',
        fileName: 'test2.txt',
        chunk: 'Information about dogs',
        embedding: [0.4, 0.5, 0.6]
      }
    ];
    
    const results = await semanticSearch('test query', 1);
    // Verify that at most one result is returned.
    expect(results.length).toBeLessThanOrEqual(1);
    // Check that the returned result has a 'score' property.
    expect(results[0]).toHaveProperty('score');
  });
  
  it('should generate answer using RAG', async () => {
    const answer = await answerQuery('What is RAG?');
    // The answer should include our mocked AI answer.
    expect(answer).toContain('Mocked AI answer');
  });
});
