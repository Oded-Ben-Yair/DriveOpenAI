<template>
  <div id="app">
    <h1>DriveOpenAI</h1>
    <FileList />
    <FileFilter />
    <FileDetail />
    <AIChat />
  </div>
</template>

<script>
import FileList from './components/FileList.vue';
import FileFilter from './components/FileFilter.vue';
import FileDetail from './components/FileDetail.vue';
import AIChat from './components/AIChat.vue';

export default {
  name: 'App',
  components: { FileList, FileFilter, FileDetail, AIChat },
};
</script>
