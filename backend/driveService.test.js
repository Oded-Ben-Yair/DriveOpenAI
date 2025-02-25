// driveService.test.js
import { jest } from '@jest/globals';

// First, mock the auth.js module to provide a dummy oauth2Client.
await jest.unstable_mockModule('./auth.js', () => {
  return {
    oauth2Client: {
      // Provide a dummy getRequestMetadataAsync so that no error is thrown.
      getRequestMetadataAsync: async () => ({ Authorization: 'Bearer dummy-token' })
    }
  };
});

// Next, mock the googleapis module so that drive.files.list returns dummy data.
await jest.unstable_mockModule('googleapis', () => {
  return {
    google: {
      drive: () => {
        return {
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
        };
      }
    }
  };
});

// Now import the function to test.
import { listFiles } from './driveService.js';

describe('Drive Service', () => {
  it('should list files with pagination', async () => {
    const files = await listFiles({ limit: 10, offset: 0 });
    expect(files).toBeDefined();
    expect(Array.isArray(files.files)).toBe(true);
    expect(files.files.length).toBe(2); // Expecting our dummy data (2 files)
    expect(files.nextPageToken).toBe('dummyToken');
  });
});
