<template>
  <div class="file-list">
    <h1>Google Drive Files</h1>
    
    <div class="filters">
      <div class="input-group">
        <label for="limit">Files per page:</label>
        <select id="limit" v-model="limit" @change="loadFiles">
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
      
      <div class="input-group">
        <label for="modified-after">Modified after:</label>
        <input 
          type="date" 
          id="modified-after" 
          v-model="modifiedAfter"
          @change="loadFiles" 
        />
      </div>
      
      <div class="input-group">
        <label for="modified-before">Modified before:</label>
        <input 
          type="date" 
          id="modified-before" 
          v-model="modifiedBefore"
          @change="loadFiles" 
        />
      </div>
      
      <button class="btn" @click="clearFilters">Clear Filters</button>
    </div>
    
    <div v-if="loading" class="loading">
      <div class="loader"></div>
      <p>Loading files...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <div class="error-icon">!</div>
      <div>{{ error }}</div>
      <button class="btn retry-btn" @click="loadFiles">Retry</button>
    </div>
    
    <div v-else-if="warning" class="warning">
      <div class="warning-icon">⚠️</div>
      <div>{{ warning }}</div>
    </div>
    
    <div v-else-if="files.length === 0" class="no-files">
      <div class="empty-icon">📁</div>
      <p>No files found. Try adjusting your filters.</p>
    </div>
    
    <table v-else class="files-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Owner</th>
          <th>Modified</th>
          <th>Size</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="file in files" :key="file.id" class="file-row">
          <td class="file-name">
            <span class="file-icon">{{ getFileIcon(file) }}</span>
            {{ file.name }}
          </td>
          <td>{{ getOwnerName(file) }}</td>
          <td>{{ formatDate(file.modifiedTime) }}</td>
          <td>{{ formatSize(file.size) }}</td>
          <td>
            <router-link :to="`/file/${file.id}`" class="btn">View</router-link>
          </td>
        </tr>
      </tbody>
    </table>
    
    <div class="pagination" v-if="files.length > 0">
      <button 
        class="btn pagination-btn" 
        @click="prevPage" 
        :disabled="!hasPrevPage"
        :class="{ disabled: !hasPrevPage }"
      >
        Previous
      </button>
      <span class="page-indicator">Page {{ currentPage }}</span>
      <button 
        class="btn pagination-btn" 
        @click="nextPage" 
        :disabled="!hasNextPage"
        :class="{ disabled: !hasNextPage }"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';

export default {
  name: 'FileListView',
  data() {
    return {
      files: [],
      nextPageToken: null,
      prevPageTokens: [],
      currentPage: 1,
      limit: 10,
      modifiedAfter: '',
      modifiedBefore: '',
      loading: false,
      error: null,
      warning: null
    };
  },
  computed: {
    hasNextPage() {
      return !!this.nextPageToken;
    },
    hasPrevPage() {
      return this.prevPageTokens.length > 0;
    }
  },
  mounted() {
    this.loadFiles();
  },
  methods: {
    async loadFiles() {
      this.loading = true;
      this.error = null;
      this.warning = null;
      
      try {
        // Format dates for API
        const formattedAfter = this.modifiedAfter ? 
          new Date(this.modifiedAfter).toISOString() : 
          null;
          
        const formattedBefore = this.modifiedBefore ? 
          new Date(this.modifiedBefore).toISOString() : 
          null;
        
        const response = await axios.get(`${API_BASE_URL}/api/files`, {
          params: { 
            limit: this.limit,
            offset: this.nextPageToken,
            modifiedAfter: formattedAfter,
            modifiedBefore: formattedBefore
          }
        });
        
        // Check for error in response data (our backend now returns errors in data)
        if (response.data.error) {
          // If it's a serious error, show it as an error
          if (response.data.files.length === 0) {
            this.error = response.data.error;
            // Reset pagination on serious errors
            this.resetPagination();
          } else {
            // If we still got some files, just show a warning
            this.warning = `Note: ${response.data.error}`;
          }
        }
        
        this.files = response.data.files || [];
        this.nextPageToken = response.data.nextPageToken;
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to load files';
        // Reset pagination on error
        this.resetPagination();
      } finally {
        this.loading = false;
      }
    },
    nextPage() {
      if (this.nextPageToken) {
        this.prevPageTokens.push(this.nextPageToken);
        this.currentPage++;
        this.loadFiles();
      }
    },
    prevPage() {
      if (this.prevPageTokens.length > 0) {
        this.nextPageToken = this.prevPageTokens.pop();
        this.currentPage--;
        this.loadFiles();
      }
    },
    clearFilters() {
      this.modifiedAfter = '';
      this.modifiedBefore = '';
      this.resetPagination();
      this.loadFiles();
    },
    resetPagination() {
      this.nextPageToken = null;
      this.prevPageTokens = [];
      this.currentPage = 1;
    },
    getOwnerName(file) {
      return file.owners && file.owners.length > 0
        ? file.owners[0].displayName || file.owners[0].emailAddress
        : 'Unknown';
    },
    formatDate(dateString) {
      if (!dateString) return 'Unknown';
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },
    formatSize(bytes) {
      if (!bytes) return 'Unknown';
      
      bytes = parseInt(bytes);
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes === 0) return '0 Bytes';
      
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    },
    getFileIcon(file) {
      const mimeTypeIcons = {
        'application/pdf': '📕',
        'application/msword': '📘',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📘',
        'application/vnd.ms-excel': '📗',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📗',
        'application/vnd.ms-powerpoint': '📙',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📙',
        'text/plain': '📄',
        'text/html': '🌐',
        'image/jpeg': '🖼️',
        'image/png': '🖼️',
        'image/gif': '🖼️',
        'video/mp4': '🎬',
        'audio/mpeg': '🎵',
        'application/zip': '🗜️',
        'application/x-zip-compressed': '🗜️',
        'application/json': '📋',
        'application/javascript': '📜'
      };
      
      // Default icon
      if (!file.mimeType) return '📄';
      
      // Return specific icon or default
      return mimeTypeIcons[file.mimeType] || '📄';
    }
  }
};
</script>

<style scoped>
.file-list {
  width: 100%;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.files-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-radius: 8px;
  overflow: hidden;
}

.files-table th,
.files-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.files-table th {
  background-color: #f0f0f0;
  font-weight: bold;
}

.files-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.files-table tr:hover {
  background-color: #eaf1fb;
}

.file-name {
  display: flex;
  align-items: center;
}

.file-icon {
  margin-right: 10px;
  font-size: 18px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.pagination-btn {
  background-color: white;
  color: #4285f4;
  border: 1px solid #4285f4;
  border-radius: 20px;
  padding: 8px 16px;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(.disabled) {
  background-color: #4285f4;
  color: white;
}

.page-indicator {
  font-weight: 500;
  color: #5f6368;
}

.loading, .error, .warning, .no-files {
  text-align: center;
  padding: 30px;
  margin: 20px 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4285f4;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #ea4335;
  background-color: #ffebee;
}

.error-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #ea4335;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  font-weight: bold;
}

.warning {
  color: #f57c00;
  background-color: #fff8e1;
}

.warning-icon {
  font-size: 24px;
  margin-bottom: 10px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
  color: #9aa0a6;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.retry-btn {
  margin-top: 15px;
}
</style>