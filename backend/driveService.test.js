// driveService.test.js

// Mock the googleapis module to simulate both the OAuth2 constructor and a successful API response.
jest.mock('googleapis', () => {
    // Dummy OAuth2 constructor that sets client credentials.
    function OAuth2(clientId, clientSecret, redirectUri) {
      this._clientId = clientId;
      this._clientSecret = clientSecret;
      this.redirectUri = redirectUri;
    }
    
    return {
      google: {
        auth: {
          OAuth2: OAuth2
        },
        drive: jest.fn(() => {
          return {
            files: {
              list: jest.fn().mockResolvedValue({
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
        })
      }
    };
  });
  
  const { listFiles } = require('./driveService');
  
  describe('Drive Service', () => {
    it('should list files with pagination', async () => {
      const files = await listFiles({ limit: 10, offset: 0 });
      expect(files).toBeDefined();
      // With our dummy data, we expect 2 files.
      expect(Array.isArray(files.files)).toBe(true);
      expect(files.files.length).toBe(2);
      expect(files.nextPageToken).toBe('dummyToken');
    });
  });
  