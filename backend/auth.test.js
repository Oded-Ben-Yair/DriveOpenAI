// auth.test.js
const { oauth2Client } = require('./auth');

describe('Google Drive OAuth', () => {
  it('should configure OAuth2 client with correct credentials', () => {
    expect(oauth2Client._clientId).toBe(process.env.GOOGLE_CLIENT_ID);
    expect(oauth2Client._clientSecret).toBe(process.env.GOOGLE_CLIENT_SECRET);
    expect(oauth2Client.redirectUri).toBe(process.env.GOOGLE_REDIRECT_URI);
  });
});
