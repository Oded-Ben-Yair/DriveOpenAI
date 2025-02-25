// routes.test.js
import request from 'supertest';
import app from './server.js';

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
});