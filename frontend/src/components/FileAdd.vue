<!-- src/components/FileAdd.vue -->
<template>
    <div class="file-add">
      <h2>Create / Upload File</h2>
      <input v-model="name" placeholder="File Name" />
      <textarea v-model="content" placeholder="File Content (for text files)"></textarea>
      <button @click="createNewFile">Create File</button>
      <br />
      <input type="file" @change="uploadFile" />
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
      async uploadFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        // For simplicity, we'll read the file as text.
        // For binary files, consider using FormData and adjusting your backend.
        const reader = new FileReader();
        reader.onload = () => {
          this.$store.dispatch('createFile', {
            name: file.name,
            content: reader.result,
          });
        };
        reader.readAsText(file);
      },
    },
  };
  </script>
  
  <style scoped>
  .file-add {
    padding: 10px;
    border: 1px solid #ccc;
    margin-bottom: 20px;
  }
  .file-add input,
  .file-add textarea {
    display: block;
    width: 100%;
    margin-bottom: 10px;
  }
  </style>
  