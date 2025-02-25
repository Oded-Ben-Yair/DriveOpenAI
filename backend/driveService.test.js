import { jest } from '@jest/globals';
import { listFiles } from './driveService.js';

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
    },
  };
  return {
    google: {
      drive: jest.fn(() => mockDrive),
    },
  };
});

jest.mock('./auth.js', () => ({
  oauth2Client: {
    getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

describe('Drive Service', () => {
  it('should list files with pagination', async () => {
    const result = await listFiles({ limit: 10, offset: 0 });
    expect(result).toStrictEqual({
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
});