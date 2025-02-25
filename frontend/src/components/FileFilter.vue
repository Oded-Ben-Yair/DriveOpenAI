<template>
    <div>
      <h2>Filter by Modified Date</h2>
      <input type="date" v-model="date" @change="filterFiles" />
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
        filteredFiles: [],
      };
    },
    computed: {
      files() {
        return this.$store.state.files;
      },
    },
    methods: {
      filterFiles() {
        if (!this.date) {
          this.filteredFiles = [];
          return;
        }
        this.filteredFiles = this.files.filter(file => new Date(file.modifiedTime) >= new Date(this.date));
      },
    },
  };
  </script>
  