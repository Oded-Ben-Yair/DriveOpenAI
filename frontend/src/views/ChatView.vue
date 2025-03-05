<template>
  <div class="chat-view container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-center mb-6">Chat with DriveOpenAI</h1>
    <!-- Indexing progress component -->
    <IndexingProgress v-if="!indexComplete" class="mb-6" @indexing-completed="onIndexingComplete" />
    <!-- Chat interface component -->
    <ChatInterface 
      ref="chatInterface"
      :disabled="!indexComplete" 
      @focus-changed="onFocusChanged"
    />
  </div>
</template>

<script>
import IndexingProgress from '@/components/IndexingProgress.vue';
import ChatInterface from '@/components/ChatInterface.vue';
import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';

export default {
  name: 'ChatView',
  components: { IndexingProgress, ChatInterface },
  data() {
    return {
      indexComplete: false,
      focusedDocumentIds: []
    };
  },
  methods: {
    onIndexingComplete() {
      this.indexComplete = true;
    },
    onFocusChanged(documentIds) {
      this.focusedDocumentIds = documentIds;
    },
    async checkIndexStatus() {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/indexing-status`);
        if (response.data.status === 'completed') {
          this.indexComplete = true;
        }
      } catch (error) {
        console.error('Error checking index status:', error);
      }
    }
  },
  mounted() {
    this.checkIndexStatus();
  }
};
</script>

<style scoped>
.chat-view {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
