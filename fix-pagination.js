// fix-pagination.js
const fs = require('fs');
const path = require('path');

// Fix the frontend store file
const storePath = path.join(__dirname, 'frontend', 'src', 'store', 'index.js');
let content = fs.readFileSync(storePath, 'utf8');

// Find and modify the fetchFiles function to better handle pagination with filters
const oldFetchFiles = `async fetchFiles({ commit }, { limit = 10, offset = 0, modifiedAfter = null, modifiedBefore = null } = {}) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        configureAxiosAuth();
        
        const response = await axios.get(\`\${API_BASE_URL}/api/files\`, {
          params: { 
            limit, 
            offset,
            modifiedAfter,
            modifiedBefore
          }
        });`;

const newFetchFiles = `async fetchFiles({ commit }, { limit = 10, offset = 0, modifiedAfter = null, modifiedBefore = null } = {}) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        configureAxiosAuth();
        
        // When using date filters, don't use page tokens (offset) directly
        // This avoids the page token validation issues with the Drive API
        const params = { limit };
        
        // Only add offset/pagination if we're not filtering by date
        if (offset && !(modifiedAfter || modifiedBefore)) {
          params.offset = offset;
        }
        
        // Add date filters if specified
        if (modifiedAfter) params.modifiedAfter = modifiedAfter;
        if (modifiedBefore) params.modifiedBefore = modifiedBefore;
        
        const response = await axios.get(\`\${API_BASE_URL}/api/files\`, { params });`;

content = content.replace(oldFetchFiles, newFetchFiles);
fs.writeFileSync(storePath, content, 'utf8');
console.log('Updated frontend store - fixed pagination with date filters');

// Now fix the backend driveService.js file
const driveServicePath = path.join(__dirname, 'backend', 'driveService.js');
let backendContent = fs.readFileSync(driveServicePath, 'utf8');

// Update the listFiles function to handle invalid page tokens
const oldListFiles = `export async function listFiles({ 
  limit = 10, 
  offset = 0,
  modifiedAfter = null,
  modifiedBefore = null,
  mimeType = null
} = {}) {
  try {
    // Build query for filtering
    let query = 'trashed=false';
    
    if (modifiedAfter) {
      query += \` and modifiedTime > "\${modifiedAfter}"\`;
    }
    
    if (modifiedBefore) {
      query += \` and modifiedTime < "\${modifiedBefore}"\`;
    }`;

const newListFiles = `export async function listFiles({ 
  limit = 10, 
  offset = 0,
  modifiedAfter = null,
  modifiedBefore = null,
  mimeType = null
} = {}) {
  try {
    // Build query for filtering with improved date handling
    let query = 'trashed=false';
    
    if (modifiedAfter) {
      try {
        // Ensure proper date format
        const afterDate = new Date(modifiedAfter);
        if (!isNaN(afterDate.getTime())) {
          query += \` and modifiedTime > '\${afterDate.toISOString()}'\`;
        } else {
          console.warn(\`Invalid modifiedAfter date: \${modifiedAfter}\`);
        }
      } catch (err) {
        console.error(\`Error parsing modifiedAfter date: \${err.message}\`);
      }
    }
    
    if (modifiedBefore) {
      try {
        const beforeDate = new Date(modifiedBefore);
        if (!isNaN(beforeDate.getTime())) {
          query += \` and modifiedTime < '\${beforeDate.toISOString()}'\`;
        } else {
          console.warn(\`Invalid modifiedBefore date: \${modifiedBefore}\`);
        }
      } catch (err) {
        console.error(\`Error parsing modifiedBefore date: \${err.message}\`);
      }
    }`;

backendContent = backendContent.replace(oldListFiles, newListFiles);

// Add validation for page token
const oldApiCall = `const response = await retryWithBackoff(() => drive.files.list({
      pageSize: Number(limit),
      pageToken: offset || undefined,
      q: query,`;

const newApiCall = `// Validate page token - only use it if not filtering by date
      // This prevents the 'Invalid Value' errors with page tokens
      const options = {
        pageSize: Number(limit),
        q: query,`;

const afterApiCall = `fields: 'nextPageToken, files(id, name, mimeType, owners, modifiedTime, size, webViewLink, md5Checksum)'
    }));`;

const newComplete = `fields: 'nextPageToken, files(id, name, mimeType, owners, modifiedTime, size, webViewLink, md5Checksum)',
        orderBy: 'modifiedTime desc'
      };
      
      // Only add page token if it doesn't look suspicious (filtering can cause issues)
      if (offset && !modifiedAfter && !modifiedBefore && 
          typeof offset === 'string' && offset.length < 200) {
        options.pageToken = offset;
      }
      
      const response = await retryWithBackoff(() => drive.files.list(options));`;

backendContent = backendContent.replace(oldApiCall, newApiCall);
backendContent = backendContent.replace(afterApiCall, newComplete);

fs.writeFileSync(driveServicePath, backendContent, 'utf8');
console.log('Updated backend driveService.js - fixed pagination and date filtering');