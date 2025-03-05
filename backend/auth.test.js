// backend/auth.test.js
// Tests for the Google OAuth configuration to ensure the OAuth2 client is properly set up.

import { oauth2Client } from './auth.js';

describe('Google Drive OAuth', () => {
  it('should configure OAuth2 client with correct credentials', () => {
    // Check that the client ID, secret, and redirect URI match environment variables.
    expect(oauth2Client._clientId).toBe(process.env.GOOGLE_CLIENT_ID);
    expect(oauth2Client._clientSecret).toBe(process.env.GOOGLE_CLIENT_SECRET);
    expect(oauth2Client.redirectUri).toBe(process.env.OAUTH_CALLBACK_URL);
  });
});
