// backend/utils.test.js
import { jest } from '@jest/globals';
import { chunkText, cosineSimilarity, retryWithBackoff } from './utils.js';

describe('Utility Functions', () => {
  describe('chunkText', () => {
    it('should split text into chunks of maximum length', () => {
      const text = 'This is a test. This is another test. And a third test.';
      const chunks = chunkText(text, 20);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].length).toBeLessThanOrEqual(20);
    });
    
    it('should handle empty input', () => {
      expect(chunkText('')).toEqual([]);
      expect(chunkText(null)).toEqual([]);
    });
  });
  
  describe('cosineSimilarity', () => {
    it('should calculate similarity correctly', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [0, 1, 0];
      
      // Orthogonal vectors should have similarity 0
      expect(cosineSimilarity(vec1, vec2)).toBe(0);
      
      // Same vector should have similarity 1
      expect(cosineSimilarity(vec1, vec1)).toBe(1);
    });
    
    it('should throw error for different length vectors', () => {
      expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow();
    });
  });
  
  describe('retryWithBackoff', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should retry failed function calls', async () => {
      const mockFn = jest.fn();
      mockFn.mockRejectedValueOnce(new Error('First failure'));
      mockFn.mockRejectedValueOnce(new Error('Second failure'));
      mockFn.mockResolvedValueOnce('success');
      
      const promise = retryWithBackoff(mockFn, 3, 10);
      
      // Fast-forward timers to handle the delays
      jest.runAllTimers();
      
      const result = await promise;
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
    
    it('should throw after max retries', async () => {
      const mockFn = jest.fn();
      mockFn.mockRejectedValue(new Error('Always fails'));
      
      const promise = retryWithBackoff(mockFn, 2, 10);
      
      // Fast-forward timers
      jest.runAllTimers();
      
      await expect(promise).rejects.toThrow('Always fails');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});