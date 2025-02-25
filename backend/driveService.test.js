import { jest } from '@jest/globals';
import { listFiles } from './driveService.js';

// Mock googleapis to prevent real API calls
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
    },
  };
  return {
    google: {
      drive: jest.fn(() => mockDrive),
    },
  };
});

// Mock auth.js to bypass authentication
jest.mock('./auth.js', () => ({
  oauth2Client: { getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' }) },
}));

describe('Drive Service', () => {
  it('should list files with pagination', async () => {
    const result = await listFiles({ limit: 10, offset: 0 });
    expect(result).toBeDefined();
    expect(Array.isArray(result.files)).toBe(true);
    expect(result.files.length).toBeLessThanOrEqual(10);
  });
});