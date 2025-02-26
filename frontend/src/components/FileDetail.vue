<template>
    <div>
      <h2>File Details</h2>
      <input v-model="fileId" placeholder="Enter File ID" />
      <button @click="fetchFile">Fetch</button>
      <button @click="deleteFile" :disabled="!selectedFile">Delete</button>
      <div v-if="selectedFile">
        <p>ID: {{ selectedFile.id }}</p>
        <p>Name: {{ selectedFile.name }}</p>
        <p>Owners: {{ selectedFile.owners?.join(', ') }}</p>
        <p>Modified: {{ selectedFile.modifiedTime }}</p>
        <p>Size: {{ selectedFile.size }} bytes</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        fileId: '',
      };
    },
    computed: {
      selectedFile() {
        return this.$store.state.selectedFile;
      },
    },
    methods: {
      fetchFile() {
        this.$store.dispatch('fetchFileById', this.fileId);
      },
      deleteFile() {
        this.$store.dispatch('deleteFile', this.fileId).then(() => {
          this.fileId = '';
        });
      },
    },
  };
  </script>
  