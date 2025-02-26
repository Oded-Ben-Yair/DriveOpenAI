// routes.test.js
import { jest } from '@jest/globals';
import request from 'supertest';

// --- MOCK SETUP ---
// Mock auth.js for a dummy oauth2Client.
await jest.unstable_mockModule('./auth.js', () => {
  return {
    oauth2Client: {
      getRequestMetadataAsync: async () => ({ Authorization: 'Bearer dummy-token' })
    }
  };
});

// Mock googleapis for dummy drive.files.list response.
await jest.unstable_mockModule('googleapis', () => {
  return {
    google: {
      drive: () => ({
        files: {
          list: async () => ({
            data: {
              nextPageToken: 'dummyToken',
              files: [
                {
                  id: '1',
                  name: 'File1',
                  owners: [{ displayName: 'Owner1' }],
                  modifiedTime: '2023-01-01T00:00:00Z',
                  size: '1000'
                },
                {
                  id: '2',
                  name: 'File2',
                  owners: [{ displayName: 'Owner2' }],
                  modifiedTime: '2023-01-02T00:00:00Z',
                  size: '2000'
                }
              ]
            }
          })
        }
      })
    }
  };
});

// Import the server AFTER mocks are set.
import app from './server.js';

describe('API Endpoints', () => {
  it('should return files on GET /api/files?limit=5', async () => {
    const response = await request(app).get('/api/files?limit=5');
    expect(response.status).toBe(200);
    expect(response.body.files).toBeDefined();
    expect(Array.isArray(response.body.files)).toBe(true);
    // Our mock returns 2 files.
    expect(response.body.files.length).toBe(2);
    expect(response.body.nextPageToken).toBe('dummyToken');
  });

  it('should return an AI answer on POST /api/ai-query', async () => {
    const response = await request(app)
      .post('/api/ai-query')
      .send({ question: 'What is AI?' });
    expect(response.status).toBe(200);
    expect(response.body.answer).toBeDefined();
  });

  // Remove tests for endpoints that aren't implemented if needed.
});
