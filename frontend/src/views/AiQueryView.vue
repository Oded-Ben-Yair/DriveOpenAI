<template>
    <div class="ai-query">
      <h1>Ask questions about your Drive files</h1>
      
      <div class="search-container">
        <div class="search-box">
          <input
            v-model="question"
            @keyup.enter="askQuestion"
            placeholder="Ask a question about your files..."
            type="text"
            class="search-input"
          />
          <button @click="askQuestion" class="search-button" :disabled="loading">
            <span v-if="loading">Thinking...</span>
            <span v-else>Ask</span>
          </button>
        </div>
        
        <div class="suggestion-chips">
          <div 
            v-for="(suggestion, index) in suggestions" 
            :key="index" 
            class="suggestion-chip"
            @click="useQuestion(suggestion)"
          >
            {{ suggestion }}
          </div>
        </div>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-if="answer" class="answer-container">
        <h2>Answer:</h2>
        <div class="answer-content">
          {{ answer }}
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { mapActions } from 'vuex';
  
  export default {
    name: 'AiQueryView',
    data() {
      return {
        question: '',
        answer: '',
        loading: false,
        error: null,
        suggestions: [
          'Who owns the most files?',
          'Which file was modified most recently?',
          'What is the average number of files per owner?',
          'Which file is the largest?',
          'What is the distribution of files by their last modified date?'
        ]
      };
    },
    methods: {
      ...mapActions(['askAI']),
      
      async askQuestion() {
        if (!this.question || this.loading) return;
        
        this.loading = true;
        this.error = null;
        this.answer = '';
        
        try {
          this.answer = await this.askAI(this.question);
        } catch (error) {
          this.error = 'Failed to get an answer. Please try again.';
          console.error('AI query error:', error);
        } finally {
          this.loading = false;
        }
      },
      
      useQuestion(question) {
        this.question = question;
        this.askQuestion();
      }
    }
  };
  </script>
  
  <style scoped>
  .ai-query {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .search-container {
    margin: 30px 0;
  }
  
  .search-box {
    display: flex;
    margin-bottom: 15px;
  }
  
  .search-input {
    flex: 1;
    padding: 12px 15px;
    border: 1px solid #ddd;
    border-radius: 24px 0 0 24px;
    font-size: 16px;
    outline: none;
  }
  
  .search-input:focus {
    border-color: #4285f4;
  }
  
  .search-button {
    padding: 0 20px;
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 0 24px 24px 0;
    font-size: 16px;
    cursor: pointer;
  }
  
  .search-button:hover {
    background-color: #3b78e7;
  }
  
  .search-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .suggestion-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .suggestion-chip {
    background-color: #f1f3f4;
    padding: 8px 16px;
    border-radius: 18px;
    font-size: 14px;
    cursor: pointer;
  }
  
  .suggestion-chip:hover {
    background-color: #e8eaed;
  }
  
  .error-message {
    color: #ea4335;
    background-color: #ffebee;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 20px;
  }
  
  .answer-container {
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .answer-container h2 {
    margin-top: 0;
    color: #4285f4;
    font-size: 18px;
  }
  
  .answer-content {
    white-space: pre-line;
    line-height: 1.5;
  }
  </style>