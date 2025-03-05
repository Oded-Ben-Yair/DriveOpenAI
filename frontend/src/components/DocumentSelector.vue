<!-- frontend/src/components/DocumentSelector.vue -->
<template>
  <div class="document-selector">
    <div class="search-box">
      <input 
        v-model="searchTerm" 
        type="text" 
        placeholder="Search files..."
      />
    </div>
    
    <div class="file-list">
      <div v-if="loading" class="loading">
        Loading files...
      </div>
      
      <div v-else-if="files.length === 0" class="no-files">
        No files found.
      </div>
      
      <div v-else class="file-items">
        <div 
          v-for="file in filteredFiles" 
          :key="file.id" 
          class="file-item"
          :class="{ selected: selectedFileIds.includes(file.id) }"
          @click="toggleFileSelection(file.id)"
        >
          <div class="file-icon">
            <!-- Add icon based on mime type -->
            📄
          </div>
          <div class="file-info">
            <div class="file-name">{{ file.name }}</div>
            <div class="file-meta">
              {{ formatSize(file.size) }} • {{ formatDate(file.modifiedTime) }}
            </div>
          </div>
          <div class="selection-indicator">
            <div v-if="selectedFileIds.includes(file.id)" class="checkbox checked">✓</div>
            <div v-else class="checkbox"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="selection-controls">
      <div class="selection-count">
        {{ selectedFileIds.length }} file(s) selected
      </div>
      <div class="selection-actions">
        <button @click="clearSelection">Clear</button>
        <button @click="applySelection" :disabled="selectedFileIds.length === 0">
          Focus on selected
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';

export default {
  name: 'DocumentSelector',
  data() {
    return {
      files: [],
      loading: false,
      searchTerm: '',
      selectedFileIds: []
    };
  },
  computed: {
    filteredFiles() {
      if (!this.searchTerm) return this.files;
      
      const term = this.searchTerm.toLowerCase();
      return this.files.filter(file => 
        file.name.toLowerCase().includes(term)
      );
    }
  },
  methods: {
    async fetchFiles() {
      this.loading = true;
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/files`, {
          params: { limit: 100 }
        });
        
        this.files = response.data.files || [];
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        this.loading = false;
      }
    },
    toggleFileSelection(fileId) {
      const index = this.selectedFileIds.indexOf(fileId);
      
      if (index === -1) {
        this.selectedFileIds.push(fileId);
      } else {
        this.selectedFileIds.splice(index, 1);
      }
    },
    clearSelection() {
      this.selectedFileIds = [];
      this.$emit('selection-changed', []);
    },
    applySelection() {
      this.$emit('selection-changed', this.selectedFileIds);
    },
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },
    formatSize(bytes) {
      if (!bytes) return '';
      
      bytes = parseInt(bytes);
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes === 0) return '0 Bytes';
      
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }
  },
  mounted() {
    this.fetchFiles();
  }
};
</script>

<style>
.document-selector {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.search-box {
  margin-bottom: 15px;
}

.search-box input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  max-height: 300px;
}

.loading, .no-files {
  padding: 20px;
  text-align: center;
  color: #666;
}

.file-items {
  display: flex;
  flex-direction: column;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.file-item:hover {
  background-color: #f5f5f5;
}

.file-item.selected {
  background-color: #e3f2fd;
}

.file-icon {
  margin-right: 10px;
  font-size: 20px;
}

.file-info {
  flex: 1;
  min-width: 0; /* Allow text to truncate */
}

.file-name {
  font-weight: 500;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 12px;
  color: #777;
}

.selection-indicator {
  margin-left: 10px;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox.checked {
  background-color: #4285f4;
  border-color: #4285f4;
  color: white;
}

.selection-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.selection-count {
  font-size: 14px;
  color: #666;
}

.selection-actions {
  display: flex;
  gap: 10px;
}

.selection-actions button {
  padding: 6px 12px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  color: #333;
}

.selection-actions button:hover {
  background-color: #e0e0e0;
}

.selection-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>