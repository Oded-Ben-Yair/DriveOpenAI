<template>
  <div>
    <div class="bg-white shadow sm:rounded-lg mb-6">
      <div class="px-4 py-5 sm:p-6">
        <h2 class="text-lg font-medium text-gray-900">Ask AI Assistant</h2>
        <p class="mt-1 text-sm text-gray-500">
          Ask questions about your Google Drive files. The AI can search through your documents and provide answers based on their content.
        </p>
        
        <!-- Indexing status -->
        <div v-if="indexingStatus.loading" class="mt-4 flex items-center text-sm text-gray-500">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Indexing your files for search... This may take a moment.</span>
        </div>
        
        <div v-else-if="indexingStatus.indexed" class="mt-4 text-sm text-green-600">
          <span>✓ {{ indexingStatus.count }} file chunks indexed and ready for search</span>
          <button 
            @click="rebuildIndex" 
            class="ml-2 text-primary-600 hover:text-primary-500 underline"
          >
            Reindex
          </button>
        </div>
        
        <div v-else class="mt-4">
          <button 
            @click="buildIndex" 
            class="inline-flex items-center px-3 py-2 border border-primary-300 text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg class="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Index Files for Search
          </button>
        </div>
        
        <!-- Question input -->
        <div class="mt-6">
          <div class="flex rounded-md shadow-sm">
            <input 
              v-model="question" 
              @keyup.enter="askQuestion"
              type="text" 
              class="input flex-1" 
              placeholder="Ask a question about your files..."
            />
            <button 
              @click="askQuestion" 
              :disabled="loading || !question.trim()"
              class="ml-3 btn inline-flex items-center"
              :class="{ 'opacity-50 cursor-not-allowed': loading || !question.trim() }"
            >
              <span v-if="loading">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Thinking...
              </span>
              <span v-else>Ask</span>
            </button>
          </div>
          
          <div class="mt-2 flex flex-wrap gap-2">
            <button 
              v-for="(suggestion, index) in suggestions" 
              :key="index"
              @click="useQuestion(suggestion)"
              class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Error message -->
    <div v-if="error" class="rounded-md bg-red-50 p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ error }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Answer display -->
    <div v-if="answer" class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg font-medium text-gray-900">Answer</h3>
        <div class="mt-4 text-gray-900 whitespace-pre-line">
          {{ mainAnswer }}
        </div>
        
        <div v-if="sourcesList && sourcesList.length > 0" class="mt-6 border-t border-gray-200 pt-4">
          <h4 class="text-sm font-medium text-gray-500">Sources</h4>
          <ul class="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
            <li v-for="(source, index) in sourcesList" :key="index">{{ source }}</li>
          </ul>
        </div>
        
        <div v-if="processingTime" class="mt-6 text-xs text-gray-500">
          Processing time: {{ (processingTime / 1000).toFixed(2) }}s
        </div>
      </div>
    </div>
    
    <!-- Chat history -->
    <div v-if="chatHistory.length > 0" class="mt-10">
      <h3 class="text-lg font-medium text-gray-900 mb-6">Previous Questions</h3>
      
      <div class="space-y-6">
        <div v-for="(chat, index) in chatHistory" :key="index" class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-4">
                <h4 class="text-md font-bold text-gray-900">{{ chat.question }}</h4>
                <div class="mt-2 text-sm text-gray-500 whitespace-pre-line">
                  {{ chat.answer }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AiQueryView',
  data() {
    return {
      question: '',
      answer: '',
      loading: false,
      error: null,
      processingTime: 0,
      chatHistory: [],
      suggestions: [
        'Who owns the most files?',
        'Which file was modified most recently?',
        'What is the average number of files per owner?',
        'Which file is the largest?',
        'What is the distribution of files by their last modified date?'
      ],
      indexingStatus: {
        loading: false,
        indexed: false,
        count: 0
      },
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000'
    };
  },
  computed: {
    mainAnswer() {
      if (!this.answer) return "";
      
      // Extract main answer (before "Sources:" if it exists)
      const parts = this.answer.split(/Sources:/i);
      return parts[0].trim();
    },
    sourcesList() {
      if (!this.answer || !this.answer.toLowerCase().includes("sources:")) return null;
      
      // Extract sources list
      const sourcesSection = this.answer.split(/Sources:/i)[1];
      if (!sourcesSection) return null;
      
      return sourcesSection
        .split('\n')
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0);
    }
  },
  mounted() {
    // Check index status on load
    this.checkIndexStatus();
  },
  methods: {
    async askQuestion() {
      if (!this.question.trim() || this.loading) return;
      
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${this.apiBaseUrl}/api/ai-query`, {
          question: this.question
        });
        
        this.answer = response.data.answer;
        this.processingTime = response.data.processingTime;
        
        // Add to chat history
        this.chatHistory.unshift({
          question: this.question,
          answer: this.answer
        });
        
        // Clear question field
        this.question = '';
      } catch (error) {
        console.error('Error fetching answer:', error);
        this.error = error.response?.data?.error || 'Failed to get an answer. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    
    useQuestion(suggestion) {
      this.question = suggestion;
      this.askQuestion();
    },
    
    async buildIndex() {
      this.indexingStatus.loading = true;
      
      try {
        const response = await axios.post(`${this.apiBaseUrl}/api/index-build`);
        this.indexingStatus.indexed = true;
        this.indexingStatus.count = response.data.chunks;
      } catch (error) {
        console.error('Error building index:', error);
        this.error = error.response?.data?.error || 'Failed to index files. Please try again.';
      } finally {
        this.indexingStatus.loading = false;
      }
    },
    
    async rebuildIndex() {
      this.indexingStatus.loading = true;
      
      try {
        const response = await axios.post(`${this.apiBaseUrl}/api/index-build?force=true`);
        this.indexingStatus.indexed = true;
        this.indexingStatus.count = response.data.chunks;
      } catch (error) {
        console.error('Error rebuilding index:', error);
        this.error = error.response?.data?.error || 'Failed to reindex files. Please try again.';
      } finally {
        this.indexingStatus.loading = false;
      }
    },
    
    async checkIndexStatus() {
      // There's no dedicated endpoint, so we'll just check if indexing works
      try {
        const response = await axios.post(`${this.apiBaseUrl}/api/index-build`);
        if (response.data.chunks > 0) {
          this.indexingStatus.indexed = true;
          this.indexingStatus.count = response.data.chunks;
        }
      } catch (error) {
        console.error('Error checking index status:', error);
        // Don't show error to the user for this check
      }
    }
  }
};
</script>