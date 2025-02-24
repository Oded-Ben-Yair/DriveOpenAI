// server.js
const express = require('express');
const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Health-check endpoint
app.get('/health', (req, res) => res.status(200).send('OK'));

// Start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
