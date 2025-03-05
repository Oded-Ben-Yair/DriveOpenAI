<!-- frontend/src/components/ChatInterface.vue -->
<template>
  <div class="chat-interface">
    <div class="chat-container">
      <!-- Messages display -->
      <div ref="messagesContainer" class="messages-container">
        <div 
          v-for="(message, index) in messages" 
          :key="index" 
          :class="['message', message.role]"
        >
          <div class="message-content">
            {{ message.content }}
          </div>
          <div v-if="message.sources && message.sources.length" class="sources">
            <div class="sources-label">Sources:</div>
            <div 
              v-for="(source, idx) in message.sources" 
              :key="idx" 
              class="source"
            >
              {{ source.fileName }}
            </div>
          </div>
        </div>
        
        <div v-if="thinking" class="message assistant thinking">
          <div class="dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
      </div>
      
      <!-- Input area -->
      <div class="input-container">
        <textarea 
          v-model="inputMessage" 
          @keydown.enter.prevent="sendMessage"
          placeholder="Ask a question about your documents..."
          :disabled="thinking"
          ref="messageInput"
          rows="1"
        ></textarea>
        <button 
          @click="sendMessage" 
          :disabled="!inputMessage.trim() || thinking"
          class="send-button"
        >
          <span v-if="thinking">Thinking...</span>
          <span v-else>Send</span>
        </button>
      </div>
    </div>
    
    <!-- Sidebar with file selection -->
    <div class="chat-sidebar">
      <h3>Focus on specific files</h3>
      <div class="file-selector">
        <DocumentSelector @selection-changed="onDocumentSelectionChanged" />
      </div>
    </div>
    
    <!-- Error toast -->
    <div v-if="errorMessage" class="error-toast">
      <div class="error-content">
        <span class="error-icon">⚠</span>
        {{ errorMessage }}
      </div>
      <button class="close-button" @click="dismissError">×</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import DocumentSelector from './DocumentSelector.vue';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';

export default {
  name: 'ChatInterface',
  components: {
    DocumentSelector
  },
  data() {
    return {
      messages: [
        { 
          role: 'assistant', 
          content: 'Hi! I can help answer questions about your Google Drive documents. What would you like to know?' 
        }
      ],
      inputMessage: '',
      thinking: false,
      conversationId: null,
      focusedDocumentIds: [],
      errorMessage: ''
    };
  },
  methods: {
    async sendMessage() {
      if (!this.inputMessage.trim() || this.thinking) return;
      
      // Add user message to chat
      this.messages.push({
        role: 'user',
        content: this.inputMessage
      });
      
      // Clear input and set thinking state
      const message = this.inputMessage;
      this.inputMessage = '';
      this.thinking = true;
      
      try {
        // Choose endpoint based on whether we have focused documents
        const endpoint = this.focusedDocumentIds.length > 0 
          ? `${API_BASE_URL}/api/ai-query/focused`
          : `${API_BASE_URL}/api/ai-conversation`;
        
        // Prepare request body
        const requestBody = {
          question: message,
          conversationId: this.conversationId
        };
        
        // Add document IDs if focused
        if (this.focusedDocumentIds.length > 0) {
          requestBody.documentIds = this.focusedDocumentIds;
        }
        
        // Send request to backend
        const response = await axios.post(endpoint, requestBody);
        
        // Store conversation ID
        this.conversationId = response.data.conversationId;
        
        // Add response to chat
        this.messages.push({
          role: 'assistant',
          content: response.data.answer,
          sources: response.data.sources
        });
      } catch (error) {
        console.error('Error sending message:', error);
        // Show error toast
        this.errorMessage = 'Failed to send message. Please try again.';
        // Add error message to chat
        this.messages.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request. Please try again.'
        });
      } finally {
        this.thinking = false;
        this.$nextTick(() => {
          this.scrollToBottom();
          this.$refs.messageInput.focus();
        });
      }
    },
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      container.scrollTop = container.scrollHeight;
    },
    onDocumentSelectionChanged(documentIds) {
      this.focusedDocumentIds = documentIds;
      // Add system message to indicate focus change
      if (documentIds.length > 0) {
        this.messages.push({
          role: 'system',
          content: `Now focusing on ${documentIds.length} selected document(s).`
        });
      } else {
        this.messages.push({
          role: 'system',
          content: 'No longer focusing on specific documents.'
        });
      }
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    dismissError() {
      this.errorMessage = '';
    }
  },
  mounted() {
    this.$refs.messageInput.focus();
  },
  updated() {
    this.scrollToBottom();
  }
};
</script>

<style>
.chat-interface {
  display: flex;
  height: 100%;
  gap: 20px;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 70vh;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f8f9fa;
}

.message {
  max-width: 80%;
  margin-bottom: 15px;
  padding: 12px 15px;
  border-radius: 18px;
  line-height: 1.4;
  word-wrap: break-word;
}

.message.user {
  background-color: #e3f2fd;
  color: #0d47a1;
  margin-left: auto;
  border-bottom-right-radius: 5px;
}

.message.assistant {
  background-color: #fff;
  color: #333;
  border-bottom-left-radius: 5px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message.system {
  background-color: #f1f1f1;
  color: #666;
  font-style: italic;
  font-size: 0.9em;
  max-width: 90%;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.sources {
  margin-top: 8px;
  font-size: 0.8em;
  color: #666;
}

.sources-label {
  font-weight: bold;
  margin-bottom: 2px;
}

.source {
  background-color: #f0f0f0;
  border-radius: 4px;
  padding: 2px 6px;
  margin: 2px 0;
  display: inline-block;
  margin-right: 5px;
}

.input-container {
  display: flex;
  padding: 10px;
  background-color: #fff;
  border-top: 1px solid #ddd;
}

textarea {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 20px;
  resize: none;
  font-family: inherit;
  font-size: inherit;
}

.send-button {
  margin-left: 10px;
  padding: 0 20px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.send-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.thinking .dots {
  display: flex;
}

.dot {
  width: 8px;
  height: 8px;
  margin: 0 4px;
  background-color: #ccc;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.3s;
}

.dot:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}

.chat-sidebar {
  width: 300px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
}

.error-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #f44336;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 100;
  max-width: 80%;
}

.error-content {
  display: flex;
  align-items: center;
}

.error-icon {
  margin-right: 10px;
}

.close-button {
  margin-left: 15px;
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .chat-interface {
    flex-direction: column;
  }
  
  .chat-sidebar {
    width: 100%;
    margin-top: 20px;
  }
}
</style>
