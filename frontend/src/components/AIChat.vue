<template>
    <div>
      <h2>Ask AI</h2>
      <input v-model="question" @keyup.enter="ask" placeholder="Type your question" :disabled="loading" />
      <button @click="ask" :disabled="loading">Ask</button>
      <p v-if="loading">Loading...</p>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="answer">{{ answer }}</p>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        question: '',
        answer: ''
      };
    },
    computed: {
      loading() {
        return this.$store.state.loading;
      },
      error() {
        return this.$store.state.error;
      }
    },
    methods: {
      async ask() {
        if (!this.question) return;
        try {
          this.answer = await this.$store.dispatch('askAI', this.question);
        } catch (error) {
          this.answer = 'Error occurred while fetching AI response';
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .error {
    color: red;
  }
  </style>