<template>
  <div class="file-detail">
    <div class="back-link">
      <router-link to="/" class="btn btn-back">
        ← Back to Files
      </router-link>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
      <p>Loading file details...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error-icon">!</div>
      <div class="error-message">{{ error }}</div>
    </div>

    <div v-else-if="!file" class="not-found-container">
      <p>File not found or access denied.</p>
    </div>

    <template v-else>
      <div class="file-header">
        <h1>{{ file.name }}</h1>
        <div class="file-actions">
          <button @click="deleteFile" class="btn btn-danger">Delete</button>
        </div>
      </div>

      <div class="file-metadata">
        <div class="metadata-item">
          <span class="label">File ID:</span>
          <span class="value">{{ file.id }}</span>
        </div>

        <div class="metadata-item">
          <span class="label">Type:</span>
          <span class="value">{{ formatMimeType(file.mimeType) }}</span>
        </div>

        <div class="metadata-item">
          <span class="label">Size:</span>
          <span class="value">{{ formatSize(file.size) }}</span>
        </div>

        <div class="metadata-item">
          <span class="label">Modified:</span>
          <span class="value">{{ formatDate(file.modifiedTime) }}</span>
        </div>

        <div class="metadata-item">
          <span class="label">Owner:</span>
          <span class="value">{{ getOwnerName(file) }}</span>
        </div>
      </div>

      <div class="edit-section">
        <h2>Edit File Details</h2>
        <div class="input-group">
          <label for="file-name">Name:</label>
          <input id="file-name" v-model="newName" placeholder="New file name" />
        </div>

        <div class="input-group">
          <label for="file-description">Description:</label>
          <textarea id="file-description" v-model="newDescription" placeholder="File description"></textarea>
        </div>

        <button @click="saveChanges" class="btn" :disabled="!hasChanges">Save Changes</button>
      </div>
    </template>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'FileDetailView',
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      error: null,
      newName: '',
      newDescription: ''
    };
  },
  computed: {
    ...mapState({
      file: state => state.selectedFile
    }),
    hasChanges() {
      return (this.newName && this.newName !== this.file?.name) || 
             (this.newDescription && this.newDescription !== this.file?.description);
    }
  },
  async mounted() {
    await this.loadFile();
  },
  methods: {
    ...mapActions(['fetchFileById', 'editFile', 'deleteFile']),
    
    async loadFile() {
      this.loading = true;
      this.error = null;
      
      try {
        await this.fetchFileById(this.id);
        this.newName = this.file?.name || '';
        this.newDescription = this.file?.description || '';
      } catch (error) {
        this.error = 'Failed to load file details: ' + (error.message || 'Unknown error');
      } finally {
        this.loading = false;
      }
    },
    
    async saveChanges() {
      if (!this.hasChanges) return;
      
      const updatedData = {};
      if (this.newName && this.newName !== this.file.name) {
        updatedData.name = this.newName;
      }
      
      if (this.newDescription !== this.file.description) {
        updatedData.description = this.newDescription;
      }
      
      try {
        await this.editFile({ id: this.id, updatedData });
      } catch (error) {
        this.error = 'Failed to update file: ' + (error.message || 'Unknown error');
      }
    },
    
    async deleteFile() {
      if (!confirm('Are you sure you want to delete this file?')) return;
      
      try {
        await this.deleteFile(this.id);
        this.$router.push('/');
      } catch (error) {
        this.error = 'Failed to delete file: ' + (error.message || 'Unknown error');
      }
    },
    
    formatMimeType(mimeType) {
      if (!mimeType) return 'Unknown';
      
      const mimeMap = {
        'application/pdf': 'PDF Document',
        'application/msword': 'Word Document',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
        'application/vnd.ms-excel': 'Excel Spreadsheet',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
        'text/plain': 'Text File',
        'text/html': 'HTML File',
        'image/jpeg': 'JPEG Image',
        'image/png': 'PNG Image',
        'image/gif': 'GIF Image'
      };
      
      return mimeMap[mimeType] || mimeType;
    },
    
    formatSize(bytes) {
      if (!bytes) return 'Unknown';
      
      bytes = parseInt(bytes);
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes === 0) return '0 Bytes';
      
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    },
    
    formatDate(dateString) {
      if (!dateString) return 'Unknown';
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },
    
    getOwnerName(file) {
      return file.owners && file.owners.length > 0
        ? file.owners[0].displayName || file.owners[0].emailAddress
        : 'Unknown';
    }
  }
};
</script>

<style scoped>
.file-detail {
  max-width: 800px;
  margin: 0 auto;
}

.back-link {
  margin-bottom: 20px;
}

.btn-back {
  background-color: transparent;
  color: #4285f4;
  border: 1px solid #4285f4;
}

.btn-back:hover {
  background-color: #f1f3f4;
}

.loading-container, .error-container, .not-found-container {
  text-align: center;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 20px 0;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
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
}

.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4285f4;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #dadce0;
}

.file-metadata {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.metadata-item {
  display: flex;
  margin-bottom: 12px;
}

.label {
  font-weight: 500;
  color: #5f6368;
  width: 100px;
}

.value {
  flex: 1;
}

.edit-section {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.edit-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #202124;
}

input, textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 15px;
}

textarea {
  min-height: 100px;
  resize: vertical;
}
</style>