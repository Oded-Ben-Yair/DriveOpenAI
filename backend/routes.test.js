import { jest } from '@jest/globals';
import request from 'supertest';
import app from './server.js';

jest.mock('googleapis', () => {
  const mockDrive = {
    files: {
      list: jest.fn().mockResolvedValue({
        data: {
          kind: 'drive#fileList',
          files: [
            {
              kind: 'drive#file',
              id: 'file1',
              name: 'test.txt',
              owners: [{ kind: 'drive#user', emailAddress: 'user@example.com' }],
              modifiedTime: '2023-01-01T00:00:00Z',
              size: '1024',
            },
          ],
          nextPageToken: null,
        },
      }),
      get: jest.fn().mockResolvedValue({
        data: {
          kind: 'drive#file',
          id: 'file1',
          name: 'test.txt',
          owners: [{ kind: 'drive#user', emailAddress: 'user@example.com' }],
          modifiedTime: '2023-01-01T00:00:00Z',
          size: '1024',
        },
      }),
      delete: jest.fn().mockResolvedValue(undefined),
    },
  };
  return {
    google: {
      drive: jest.fn(() => mockDrive),
    },
  };
});

jest.mock('./aiService.js', () => ({
  askQuestion: jest.fn().mockResolvedValue('Mocked AI answer'),
}));

jest.mock('./auth.js', () => ({
  oauth2Client: {
    getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

describe('API Endpoints', () => {
  it('should return files on GET /api/files?limit=5', async () => {
    const response = await request(app).get('/api/files?limit=5');
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      kind: 'drive#fileList',
      files: [
        {
          kind: 'drive#file',
          id: 'file1',
          name: 'test.txt',
          owners: [{ kind: 'drive#user', emailAddress: 'user@example.com' }],
          modifiedTime: '2023-01-01T00:00:00Z',
          size: '1024',
        },
      ],
      nextPageToken: null,
    });
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
    expect(response.body).toStrictEqual({
      kind: 'drive#file',
      id: 'file1',
      name: 'test.txt',
      owners: [{ kind: 'drive#user', emailAddress: 'user@example.com' }],
      modifiedTime: '2023-01-01T00:00:00Z',
      size: '1024',
    });
  });

  it('should delete a file on DELETE /api/files/:id', async () => {
    const response = await request(app).delete('/api/files/file1');
    expect(response.status).toBe(204);
  });
});