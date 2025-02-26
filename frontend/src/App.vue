<!-- src/App.vue -->
<template>
  <div id="app">
    <header>
      <h1>DriveOpenAI</h1>
      <p>Hi, {{ userName }}! How can I assist you with your Drive folder today?</p>
    </header>
    <main class="main-container">
      <aside class="sidebar">
        <!-- Sidebar with File Actions -->
        <FileAdd />
        <hr />
        <nav>
          <button @click="navigate('list')">File Explorer</button>
          <button @click="navigate('filter')">Filter Files</button>
          <button @click="navigate('detail')">File Details</button>
        </nav>
      </aside>
      <section class="content">
        <component :is="currentView"></component>
      </section>
      <section class="chat">
        <AIChat />
      </section>
    </main>
  </div>
</template>

<script>
import FileAdd from './components/FileAdd.vue';
import FileList from './components/FileList.vue';
import FileFilter from './components/FileFilter.vue';
import FileDetail from './components/FileDetail.vue';
import AIChat from './components/AIChat.vue';

export default {
  name: 'App',
  components: {
    FileAdd,
    FileList,
    FileFilter,
    FileDetail,
    AIChat,
  },
  data() {
    return {
      currentView: 'FileList', // default view for file explorer
      userName: 'User', // Ideally, fetch from OAuth profile info
    };
  },
  methods: {
    navigate(view) {
      if (view === 'list') this.currentView = 'FileList';
      if (view === 'filter') this.currentView = 'FileFilter';
      if (view === 'detail') this.currentView = 'FileDetail';
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  margin: 20px;
}
header {
  text-align: center;
  margin-bottom: 20px;
}
.main-container {
  display: flex;
  gap: 20px;
}
.sidebar {
  flex: 0 0 250px;
  border: 1px solid #ccc;
  padding: 10px;
  max-height: 80vh;
  overflow-y: auto;
}
.content {
  flex: 1;
  border: 1px solid #ccc;
  padding: 10px;
  max-height: 80vh;
  overflow-y: auto;
}
.chat {
  flex: 0 0 350px;
  border: 1px solid #ccc;
  padding: 10px;
  max-height: 80vh;
  overflow-y: auto;
}
button {
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 8px 12px;
  margin: 5px 0;
  cursor: pointer;
  border-radius: 4px;
}
button:hover {
  background-color: #357ae8;
}
</style>
