// server.test.js
import request from 'supertest';
import app from './server.js';

describe('Server', () => {
  it('should respond with 200 on /health', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });
});