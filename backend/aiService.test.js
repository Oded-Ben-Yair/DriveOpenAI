// aiService.test.js
import { askQuestion } from './aiService.js';

describe('AI Service', () => {
  it('should return an answer for a given question', async () => {
    const answer = await askQuestion('What is AI?');
    expect(answer).toBeDefined();
    expect(typeof answer).toBe('string');
  });
});