// routes.test.js

// Mock the driveService module so that GET /api/files returns dummy data.
jest.mock('./driveService', () => ({
    listFiles: jest.fn().mockResolvedValue({
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
    })
  }));
  
  const request = require('supertest');
  const app = require('./server');
  
  describe('API Endpoints', () => {
    it('should return files on GET /api/files?limit=5', async () => {
      const response = await request(app).get('/api/files?limit=5');
      // Expect status 200 and our dummy data
      expect(response.status).toBe(200);
      expect(response.body.files).toBeDefined();
      expect(Array.isArray(response.body.files)).toBe(true);
      // Our dummy mock returns 2 files regardless of limit
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
  });
  