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
        Loading files...
      </div>
      
      <div v-else-if="error" class="error">
        Error: {{ error }}
      </div>
      
      <div v-else-if="files.length === 0" class="no-files">
        No files found. Try adjusting your filters.
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
          <tr v-for="file in files" :key="file.id">
            <td>{{ file.name }}</td>
            <td>{{ getOwnerName(file) }}</td>
            <td>{{ formatDate(file.modifiedTime) }}</td>
            <td>{{ formatSize(file.size) }}</td>
            <td>
              <router-link :to="`/file/${file.id}`" class="btn">View</router-link>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination">
        <button 
          class="btn" 
          @click="prevPage" 
          :disabled="!hasPrevPage"
          :class="{ disabled: !hasPrevPage }"
        >
          Previous
        </button>
        <span>Page {{ currentPage }}</span>
        <button 
          class="btn" 
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
        error: null
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
          
          this.files = response.data.files || [];
          this.nextPageToken = response.data.nextPageToken;
        } catch (error) {
          this.error = error.message || 'Failed to load files';
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
        this.nextPageToken = null;
        this.prevPageTokens = [];
        this.currentPage = 1;
        this.loadFiles();
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
    border-radius: 4px;
  }
  
  .files-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  
  .files-table th,
  .files-table td {
    border: 1px solid #ddd;
    padding: 10px;
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
  
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-top: 20px;
  }
  
  .loading, .error, .no-files {
    text-align: center;
    padding: 20px;
    margin: 20px 0;
    background-color: #f9f9f9;
    border-radius: 4px;
  }
  
  .error {
    color: #ea4335;
    background-color: #ffebee;
  }
  
  .disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  </style>