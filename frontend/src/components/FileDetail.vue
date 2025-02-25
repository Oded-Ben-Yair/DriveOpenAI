<template>
    <div>
      <h2>File Details</h2>
      <input v-model="fileId" placeholder="Enter File ID" :disabled="loading" />
      <button @click="fetchFile" :disabled="loading">Fetch</button>
      <button @click="deleteFile" :disabled="!selectedFile || loading">Delete</button>
      <p v-if="loading">Loading...</p>
      <p v-if="error" class="error">{{ error }}</p>
      <div v-if="selectedFile">
        <p>ID: {{ selectedFile.id }}</p>
        <p>Name: {{ selectedFile.name }}</p>
        <p>Owners: {{ selectedFile.owners.join(', ') }}</p>
        <p>Modified: {{ selectedFile.modifiedTime }}</p>
        <p>Size: {{ selectedFile.size }} bytes</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        fileId: ''
      };
    },
    computed: {
      selectedFile() {
        return this.$store.state.selectedFile;
      },
      loading() {
        return this.$store.state.loading;
      },
      error() {
        return this.$store.state.error;
      }
    },
    methods: {
      fetchFile() {
        if (!this.fileId) return;
        this.$store.dispatch('fetchFileById', this.fileId);
      },
      deleteFile() {
        if (!this.selectedFile) return;
        this.$store.dispatch('deleteFile', this.selectedFile.id).then(() => {
          this.fileId = '';
        });
      }
    }
  };
  </script>
  
  <style scoped>
  .error {
    color: red;
  }
  </style>