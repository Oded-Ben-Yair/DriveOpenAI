<template>
    <div>
      <h2>Filter by Modified Date</h2>
      <input type="date" v-model="date" @change="filterFiles" :disabled="loading" />
      <p v-if="loading">Loading...</p>
      <p v-if="error" class="error">{{ error }}</p>
      <ul>
        <li v-for="file in filteredFiles" :key="file.id">
          {{ file.name }} - {{ file.modifiedTime }}
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        date: '',
        filteredFiles: []
      };
    },
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
      filterFiles() {
        if (!this.date) return;
        this.filteredFiles = this.files.filter(file => new Date(file.modifiedTime) >= new Date(this.date));
      }
    }
  };
  </script>
  
  <style scoped>
  .error {
    color: red;
  }
  </style>