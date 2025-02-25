<template>
    <div>
      <h2>Google Drive Files</h2>
      <button @click="fetchFiles" :disabled="loading">Refresh</button>
      <p v-if="loading">Loading...</p>
      <p v-if="error" class="error">{{ error }}</p>
      <ul>
        <li v-for="file in files" :key="file.id">
          {{ file.name }} - {{ file.owners[0] }} - {{ file.modifiedTime }}
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    computed: {
      files() {
        return this.$store.state.files;
      },
      loading() {
        return this.$store.state.loading;
      },
      error() {
        return this.$store.state.error;
      }
    },
    methods: {
      fetchFiles() {
        this.$store.dispatch('fetchFiles', { limit: 10, offset: 0 });
      }
    },
    mounted() {
      this.fetchFiles();
    }
  };
  </script>
  
  <style scoped>
  .error {
    color: red;
  }
  </style>