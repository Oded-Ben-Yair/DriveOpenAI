<!-- src/components/AIChat.vue -->
<template>
    <div class="ai-chat">
      <h2>Ask AI</h2>
      <div class="chat-history" v-if="chatHistory.length">
        <div v-for="(msg, index) in chatHistory" :key="index" :class="['chat-bubble', msg.role]">
          <p>{{ msg.content }}</p>
        </div>
      </div>
      <div class="chat-input">
        <input
          v-model="question"
          @keyup.enter="ask"
          placeholder="Type your question here..."
        />
        <button @click="ask">Ask</button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        question: '',
        chatHistory: [
          {
            role: 'assistant',
            content: 'Hi, how can I assist you today with your Drive folder?',
          },
        ],
      };
    },
    computed: {
      aiAnswer() {
        return this.$store.state.aiAnswer;
      },
    },
    watch: {
      aiAnswer(newVal) {
        if (newVal) {
          this.chatHistory.push({ role: 'assistant', content: newVal });
        }
      },
    },
    methods: {
      async ask() {
        if (!this.question.trim()) return;
        this.chatHistory.push({ role: 'user', content: this.question });
        await this.$store.dispatch('askAI', this.question);
        this.question = '';
      },
    },
  };
  </script>
  
  <style scoped>
  .ai-chat {
    padding: 10px;
    border: 1px solid #ccc;
  }
  .chat-history {
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 10px;
  }
  .chat-bubble {
    padding: 8px;
    margin: 5px 0;
    border-radius: 5px;
  }
  .chat-bubble.user {
    background: #e0f7fa;
    text-align: right;
  }
  .chat-bubble.assistant {
    background: #f1f8e9;
    text-align: left;
  }
  .chat-input {
    display: flex;
  }
  .chat-input input {
    flex: 1;
    padding: 8px;
    border: 1px solid #ccc;
  }
  .chat-input button {
    padding: 8px 12px;
    margin-left: 5px;
  }
  </style>
  