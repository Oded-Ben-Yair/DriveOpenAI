// server.test.js
const request = require('supertest');
const app = require('./server');

describe('Server', () => {
  it('should respond with 200 on /health', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });
});
