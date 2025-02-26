<template>
    <div class="file-add">
      <h2>Create a New File</h2>
      <input v-model="name" placeholder="File Name" />
      <textarea v-model="content" placeholder="File Content"></textarea>
      <button @click="createNewFile">Create File</button>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        name: '',
        content: '',
      };
    },
    methods: {
      createNewFile() {
        if (!this.name) return alert('File name is required');
        this.$store.dispatch('createFile', {
          name: this.name,
          content: this.content,
        });
        this.name = '';
        this.content = '';
      },
    },
  };
  </script>
  
  <style scoped>
  .file-add {
    margin-bottom: 20px;
    padding: 10px;
    border: 1px solid #ccc;
  }
  .file-add input {
    display: block;
    margin-bottom: 10px;
  }
  .file-add textarea {
    display: block;
    width: 100%;
    height: 80px;
    margin-bottom: 10px;
  }
  </style>
  