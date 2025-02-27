import { jest } from '@jest/globals';
import { listFiles, getFileById, deleteFile } from './driveService.js';

// Mock the googleapis and oauth2Client
jest.mock('googleapis', () => {
  return {
    google: {
      drive: jest.fn().mockImplementation(() => ({
        files: {
          list: jest.fn().mockResolvedValue({
            data: {
              files: [
                { id: 'file1', name: 'Test File 1' },
                { id: 'file2', name: 'Test File 2' }
              ],
              nextPageToken: 'dummyToken'
            }
          }),
          get: jest.fn().mockResolvedValue({
            data: { id: 'file1', name: 'Test File 1' }
          }),
          delete: jest.fn().mockResolvedValue({})
        }
      }))
    }
  };
});

// Mock the auth.js file
jest.mock('./auth.js', () => ({
  oauth2Client: { credentials: { access_token: 'mock-token' } }
}));

describe('Drive Service', () => {
  it('should list files with pagination', async () => {
    const files = await listFiles({ limit: 10 });
    expect(files).toBeDefined();
    expect(Array.isArray(files.files)).toBe(true);
    expect(files.files.length).toBe(2); // Expecting our dummy data (2 files)
    expect(files.nextPageToken).toBe('dummyToken');
  });
  
  it('should get a file by ID', async () => {
    const file = await getFileById('file1');
    expect(file).toBeDefined();
    expect(file.id).toBe('file1');
  });
  
  it('should delete a file', async () => {
    await expect(deleteFile('file1')).resolves.not.toThrow();
  });
});