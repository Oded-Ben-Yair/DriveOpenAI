<template>
    <div class="file-detail">
      <div class="back-link">
        <router-link to="/">&larr; Back to files</router-link>
      </div>
      
      <div v-if="loading" class="loading">
        Loading file details...
      </div>
      
      <div v-else-if="error" class="error">
        Error: {{ error }}
      </div>
      
      <div v-else-if="!file" class="not-found">
        File not found
      </div>
      
      <div v-else class="file-info">
        <h1>{{ file.name }}</h1>
        
        <div class="file-meta">
          <div class="meta-group">
            <h3>File Information</h3>
            <p><strong>ID:</strong> {{ file.id }}</p>
            <p><strong>Size:</strong> {{ formatSize(file.size) }}</p>
            <p><strong>Last Modified:</strong> {{ formatDate(file.modifiedTime) }}</p>
            <p><strong>MIME Type:</strong> {{ file.mimeType }}</p>
          </div>
          
          <div class="meta-group">
            <h3>Owner</h3>
            <p v-if="file.owners && file.owners.length">
              {{ getOwnerName(file) }}
            </p>
            <p v-else>Unknown</p>
          </div>
        </div>
        
        <div class="actions">
          <a v-if="file.webViewLink" :href="file.webViewLink" target="_blank" class="btn">
            Open in Google Drive
          </a>
          <button @click="deleteFile" class="btn btn-danger">Delete File</button>
        </div>
      </div>
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
    computed: {
      ...mapState({
        file: state => state.selectedFile,
        loading: state => state.loading,
        error: state => state.error
      })
    },
    mounted() {
      this.fetchFileById(this.id);
    },
    methods: {
      ...mapActions(['fetchFileById', 'deleteFile']),
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
      getOwnerName(file) {
        return file.owners && file.owners.length > 0
          ? file.owners[0].displayName || file.owners[0].emailAddress
          : 'Unknown';
      },
      async deleteFile() {
        if (!confirm('Are you sure you want to delete this file?')) return;
        
        try {
          await this.$store.dispatch('deleteFile', this.id);
          this.$router.push('/');
        } catch (error) {
          // Error is already handled in the store
          console.error('Failed to delete file:', error);
        }
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
  
  .back-link a {
    text-decoration: none;
    color: #4285f4;
    font-weight: bold;
  }
  
  .file-info h1 {
    margin-bottom: 20px;
    word-break: break-all;
  }
  
  .file-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .meta-group {
    background-color: white;
    padding: 15px;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .meta-group h3 {
    margin-top: 0;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
  }
  
  .actions {
    display: flex;
    gap: 15px;
    margin-top: 20px;
  }
  
  .loading, .error, .not-found {
    text-align: center;
    padding: 40px 20px;
    margin: 20px 0;
    background-color: #f9f9f9;
    border-radius: 4px;
  }
  
  .error {
    color: #ea4335;
    background-color: #ffebee;
  }
  
  @media (max-width: 600px) {
    .file-meta {
      grid-template-columns: 1fr;
    }
  }
  </style>