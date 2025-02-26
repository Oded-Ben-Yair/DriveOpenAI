<template>
    <div>
      <h2>Ask AI</h2>
      <input v-model="question" @keyup.enter="ask" placeholder="Type your question" />
      <button @click="ask">Ask</button>
      <p v-if="answer">{{ answer }}</p>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        question: '',
        answer: '',
      };
    },
    methods: {
      async ask() {
        if (!this.question) return;
        this.answer = await this.$store.dispatch('askAI', this.question);
      },
    },
  };
  </script>
  