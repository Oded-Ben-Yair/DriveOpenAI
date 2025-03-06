const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Import your Express app
// We need to dynamically import because the backend uses ES modules
exports.api = functions.runWith({
  timeoutSeconds: 300,
  memory: '1GB'
}).https.onRequest(async (req, res) => {
  try {
    // Dynamically import your ESM server
    const { default: app } = await import('../backend/server.js');
    
    // Forward the request to your Express app
    return app(req, res);
  } catch (error) {
    console.error('Error loading backend:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Add additional functions as needed
exports.scheduledBackup = functions.pubsub.schedule('every 24 hours').onRun((context) => {
  console.log('Running scheduled backup');
  return null;
});