import { jest } from '@jest/globals';
import request from 'supertest';
import app from './server.js';

// Mock googleapis to cover all endpoints
jest.mock('googleapis', () => {
  const mockDrive = {
    files: {
      list: jest.fn().mockResolvedValue({
        data: {
          files: [
            { id: 'file1', name: 'test.txt', owners: ['user@example.com'], modifiedTime: '2023-01-01T00:00:00Z', size: '1024' },
          ],
          nextPageToken: null,
        },
      }),
      get: jest.fn().mockResolvedValue({
        data: { id: 'file1', name: 'test.txt', owners: ['user@example.com'], modifiedTime: '2023-01-01T00:00:00Z', size: '1024' },
      }),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
  return {
    google: {
      drive: jest.fn(() => mockDrive),
    },
  };
});

// Mock aiService.js
jest.mock('./aiService.js', () => ({
  askQuestion: jest.fn().mockResolvedValue('Mocked AI answer'),
}));

// Mock auth.js
jest.mock('./auth.js', () => ({
  oauth2Client: { 
    credentials: { access_token: 'mock-token' },
    getAuthUrl: jest.fn().mockReturnValue('https://example.com/auth'),
    getToken: jest.fn().mockResolvedValue({ tokens: { access_token: 'mock-token' } })
  },
  getAuthUrl: jest.fn().mockReturnValue('https://example.com/auth'),
  getToken: jest.fn().mockResolvedValue({ access_token: 'mock-token' })
}));

// Mock gmailService.js
jest.mock('./gmailService.js', () => ({
  listEmails: jest.fn().mockResolvedValue({ emails: [], nextPageToken: null }),
}));

describe('API Endpoints', () => {
  it('should return files on GET /api/files?limit=5', async () => {
    const response = await request(app).get('/api/files?limit=5');
    expect(response.status).toBe(200);
    expect(response.body.files).toBeDefined();
    expect(Array.isArray(response.body.files)).toBe(true);
  });

  it('should return an AI answer on POST /api/ai-query', async () => {
    const response = await request(app)
      .post('/api/ai-query')
      .send({ question: 'What is AI?' });
    expect(response.status).toBe(200);
    expect(response.body.answer).toBeDefined();
  });

  it('should fetch a file by ID on GET /api/files/:id', async () => {
    const response = await request(app).get('/api/files/file1');
    expect(response.status).toBe(200);
    expect(response.body.id).toBe('file1');
  });

  it('should delete a file on DELETE /api/files/:id', async () => {
    const response = await request(app).delete('/api/files/file1');
    expect(response.status).toBe(204);
  });
});