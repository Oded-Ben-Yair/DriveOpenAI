// auth.js
const { google } = require('googleapis');
require('dotenv').config();

// Initialize OAuth2 client with credentials from environment variables
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

module.exports = { oauth2Client };
