<!-- src/components/FileFilter.vue -->
<template>
    <div class="file-filter">
      <h2>Filter Files by Date</h2>
      <input type="date" v-model="date" @change="filterFiles" />
      <ul>
        <li v-for="file in filteredFiles" :key="file.id">
          <strong>{{ file.name }}</strong> ({{ formatDate(file.modifiedTime) }})
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        date: '',
        filteredFiles: [],
      };
    },
    computed: {
      files() {
        return this.$store.state.filesData?.files || [];
      },
    },
    methods: {
      filterFiles() {
        if (!this.date) {
          this.filteredFiles = [];
          return;
        }
        this.filteredFiles = this.files.filter(file => {
          return new Date(file.modifiedTime) >= new Date(this.date);
        });
      },
      formatDate(dateStr) {
        return new Date(dateStr).toLocaleString();
      },
    },
  };
  </script>
  
  <style scoped>
  .file-filter {
    margin-bottom: 20px;
    padding: 10px;
    border: 1px solid #ccc;
  }
  </style>
  