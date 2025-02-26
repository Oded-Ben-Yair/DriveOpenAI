<!-- src/components/FileDetail.vue -->
<template>
    <div class="file-detail">
      <h2>File Details</h2>
      <input v-model="fileId" placeholder="Enter File ID" />
      <button @click="fetchFile">Fetch</button>
      <button @click="deleteFile" :disabled="!selectedFile">Delete</button>
      <div v-if="selectedFile" class="file-info">
        <p><strong>ID:</strong> {{ selectedFile.id }}</p>
        <p><strong>Name:</strong> {{ selectedFile.name }}</p>
        <input v-model="newName" placeholder="New file name" />
        <button @click="editFile" :disabled="!newName">Rename</button>
        <p><strong>Owners:</strong> {{ getOwners() }}</p>
        <p><strong>Modified:</strong> {{ formatDate(selectedFile.modifiedTime) }}</p>
        <p><strong>Size:</strong> {{ selectedFile.size }} bytes</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        fileId: '',
        newName: '',
      };
    },
    computed: {
      selectedFile() {
        return this.$store.state.selectedFile;
      },
    },
    methods: {
      fetchFile() {
        if (!this.fileId) return;
        this.$store.dispatch('fetchFileById', this.fileId);
      },
      deleteFile() {
        this.$store.dispatch('deleteFile', this.fileId).then(() => {
          this.fileId = '';
          this.newName = '';
        });
      },
      editFile() {
        const updatedData = { name: this.newName };
        this.$store.dispatch('editFile', { id: this.fileId, updatedData }).then(() => {
          this.newName = '';
        });
      },
      getOwners() {
        if (!this.selectedFile.owners) return '';
        return this.selectedFile.owners.map(o => o.displayName).join(', ');
      },
      formatDate(dateStr) {
        return new Date(dateStr).toLocaleString();
      },
    },
  };
  </script>
  
  <style scoped>
  .file-detail {
    margin-bottom: 20px;
    padding: 10px;
    border: 1px solid #ccc;
  }
  .file-info {
    margin-top: 10px;
    background: #f9f9f9;
    padding: 10px;
  }
  </style>
  