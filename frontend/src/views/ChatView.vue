<template>
  <div class="chat-view">
    <div class="chat-header">
      <h1>Smart Chat</h1>
      <p class="subtitle">Ask questions about your Google Drive documents</p>
    </div>
    
    <!-- Chat Messages -->
    <div class="chat-container" ref="chatContainer">
      <div v-if="chatHistory.length === 0" class="empty-chat">
        <div class="welcome-message">
          <h2>Welcome to Smart Chat!</h2>
          <p>Ask questions about your Drive documents and get AI-powered answers.</p>
          <div class="suggestions">
            <button 
              v-for="(suggestion, index) in suggestions" 
              :key="index"
              @click="useQuestion(suggestion)"
              class="suggestion-btn"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>
      
      <div v-else class="message-list">
        <div 
          v-for="(message, index) in chatHistory" 
          :key="index"
          :class="['message', message.role]"
        >
          <div class="message-content">
            <template v-if="message.role === 'assistant' && message.streaming">
              {{ message.content }}<span class="cursor">▌</span>
            </template>
            <template v-else>
              {{ message.content }}
            </template>
          </div>
          
          <div v-if="message.sources && message.sources.length > 0" class="message-sources">
            <div class="sources-title">Sources:</div>
            <ul class="sources-list">
              <li v-for="(source, i) in message.sources" :key="i">
                {{ source.fileName }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Chat Input -->
    <div class="chat-input-container">
      <textarea 
        v-model="question" 
        @keydown.enter.prevent="sendMessage"
        placeholder="Ask a question about your files..."
        class="chat-input"
        :disabled="loading"
        rows="2"
      ></textarea>
      <button 
        @click="sendMessage" 
        class="send-button"
        :disabled="loading || !question.trim()"
      >
        <span v-if="loading">Thinking...</span>
        <span v-else>Send</span>
      </button>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'ChatView',
  
  data() {
    return {
      question: '',
      chatHistory: [],
      loading: false,
      error: null,
      conversationId: null,
      suggestions: [
        'Who owns the most files in my Drive?',
        'Which file was modified most recently?',
        'What is the average number of files per owner?',
        'Which file is the largest in my Drive?',
        'What topics are covered in my documents?'
      ]
    }
  },
  
  watch: {
    // Scroll to bottom when chat history changes
    chatHistory() {
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    }
  },
  
  methods: {
    ...mapActions(['streamAIQuery']),
    
    scrollToBottom() {
      if (this.$refs.chatContainer) {
        this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight;
      }
    },
    
    useQuestion(question) {
      this.question = question;
      this.sendMessage();
    },
    
    async sendMessage() {
      if (!this.question.trim() || this.loading) return;
      
      // Add user message to chat
      this.chatHistory.push({
        role: 'user',
        content: this.question
      });
      
      // Add placeholder for assistant response
      const responseIndex = this.chatHistory.length;
      this.chatHistory.push({
        role: 'assistant',
        content: '',
        streaming: true
      });
      
      this.loading = true;
      const currentQuestion = this.question;
      this.question = ''; // Clear input
      
      try {
        // Use streaming response
        const streamResult = await this.streamAIQuery(currentQuestion);
        
        // Process the stream
        for await (const content of streamResult.stream()) {
          // Update the assistant's message as content arrives
          this.chatHistory[responseIndex].content += content;
        }
        
        // Mark as no longer streaming when done
        this.chatHistory[responseIndex].streaming = false;
        
        // Extract sources if they're in the final message
        const fullResponse = this.chatHistory[responseIndex].content;
        const sourcesMatch = fullResponse.match(/\nSources:\n(- .*(\n- .*)*)/);
        
        if (sourcesMatch) {
          // Extract sources and clean up message
          const sourcesList = sourcesMatch[1].split('\n').filter(line => line.startsWith('- '));
          const sources = sourcesList.map(line => ({
            fileName: line.substring(2).trim()
          }));
          
          // Remove sources text from content
          this.chatHistory[responseIndex].content = fullResponse.replace(/\nSources:\n(- .*(\n- .*)*)/, '');
          // Add sources as structured data
          this.chatHistory[responseIndex].sources = sources;
        }
      } catch (error) {
        console.error('Error in streaming response:', error);
        
        // Update assistant message with error
        this.chatHistory[responseIndex].content = 'Sorry, I encountered an error while processing your request. Please try again.';
        this.chatHistory[responseIndex].streaming = false;
        
        this.error = error.message || 'Failed to get AI response';
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.chat-header {
  margin-bottom: 20px;
}

.chat-header h1 {
  margin: 0;
  color: #4285f4;
}

.subtitle {
  margin-top: 5px;
  color: #666;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.welcome-message {
  text-align: center;
  max-width: 500px;
}

.welcome-message h2 {
  color: #4285f4;
  margin-bottom: 10px;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.suggestion-btn {
  background-color: #e8f0fe;
  color: #4285f4;
  border: 1px solid #d2e3fc;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-btn:hover {
  background-color: #d2e3fc;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  padding: 12px 16px;
  border-radius: 10px;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
  background-color: #4285f4;
  color: white;
}

.message.assistant {
  align-self: flex-start;
  background-color: #f1f3f4;
  color: #202124;
}

.message-content {
  white-space: pre-wrap;
  line-height: 1.5;
}

.message-sources {
  margin-top: 10px;
  font-size: 12px;
  opacity: 0.8;
}

.sources-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.sources-list {
  margin: 0;
  padding-left: 20px;
}

.chat-input-container {
  display: flex;
  gap: 10px;
}

.chat-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  resize: none;
  font-family: inherit;
  font-size: 15px;
}

.chat-input:focus {
  outline: none;
  border-color: #4285f4;
}

.send-button {
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 0 20px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.send-button:hover:not(:disabled) {
  background-color: #3367d6;
}

.send-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.cursor {
  display: inline-block;
  width: 3px;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  from, to { opacity: 1; }
  50% { opacity: 0; }
}
</style>