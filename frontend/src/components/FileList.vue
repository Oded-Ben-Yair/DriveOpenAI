<template>
    <div>
      <h2>Google Drive Files</h2>
      <button @click="fetchFiles">Refresh</button>
      <ul>
        <li v-for="file in files" :key="file.id">
          {{ file.name }} - {{ file.owners?.[0] }} - {{ file.modifiedTime }}
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
    },
    methods: {
      fetchFiles() {
        this.$store.dispatch('fetchFiles', { limit: 10, offset: 0 });
      },
    },
    mounted() {
      this.fetchFiles();
    },
  };
  </script>
  