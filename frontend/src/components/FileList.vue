<!-- src/components/FileList.vue -->
<template>
    <div class="file-list">
      <h2>Google Drive Files</h2>
      <div class="controls">
        <button @click="fetchFiles()">Refresh</button>
        <button v-if="nextPageToken" @click="fetchNextPage">Next Page</button>
      </div>
      <ul>
        <li v-for="file in files" :key="file.id">
          <strong>{{ file.name }}</strong>
          <em>- {{ file.owners?.[0]?.displayName || 'Unknown Owner' }}</em>
          ({{ formatDate(file.modifiedTime) }})
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    computed: {
      filesData() {
        return this.$store.state.filesData || { files: [], nextPageToken: null };
      },
      files() {
        return this.filesData.files;
      },
      nextPageToken() {
        return this.filesData.nextPageToken;
      },
    },
    methods: {
      fetchFiles(pageToken = null) {
        this.$store.dispatch('fetchFiles', { limit: 10, pageToken });
      },
      fetchNextPage() {
        if (this.nextPageToken) {
          this.fetchFiles(this.nextPageToken);
        }
      },
      formatDate(dateStr) {
        return new Date(dateStr).toLocaleString();
      },
    },
    mounted() {
      this.fetchFiles();
    },
  };
  </script>
  
  <style scoped>
  .file-list {
    margin-bottom: 20px;
    padding: 10px;
    border: 1px solid #ccc;
  }
  .controls {
    margin-bottom: 10px;
  }
  </style>
  