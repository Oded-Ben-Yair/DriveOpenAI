<!-- frontend/src/components/IndexingProgress.vue -->
<template>
  <div class="indexing-progress">
    <div v-if="status === 'idle'" class="status idle">
      <p>Documents not yet indexed. Indexing is required before asking questions.</p>
      <button @click="startIndexing" class="start-button">Start Indexing</button>
    </div>
    
    <div v-else-if="status === 'in-progress'" class="status in-progress">
      <h3>Indexing in progress...</h3>
      <div class="progress-info">
        <div class="progress-bar">
          <div 
            class="progress-bar-fill" 
            :style="{width: `${progressPercentage}%`}"
          ></div>
        </div>
        <div class="progress-text">
          {{ processed }} / {{ total }} documents ({{ progressPercentage }}%)
        </div>
      </div>
      <div v-if="currentFile" class="current-file">
        Currently indexing: {{ currentFile }}
      </div>
    </div>
    
    <div v-else-if="status === 'completed'" class="status completed">
      <div class="completion-message">
        <span class="checkmark">✓</span> Indexing complete! {{ total }} documents indexed.
      </div>
      <button @click="startIndexing(true)" class="rebuild-button">Rebuild Index</button>
    </div>
    
    <div v-else-if="status === 'error'" class="status error">
      <div class="error-message">
        <span class="error-icon">⚠</span> Error during indexing.
      </div>
      <button @click="startIndexing" class="retry-button">Retry</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';

export default {
  name: 'IndexingProgress',
  data() {
    return {
      status: 'idle',
      processed: 0,
      total: 0,
      currentFile: '',
      pollingTimer: null
    };
  },
  computed: {
    progressPercentage() {
      if (this.total === 0) return 0;
      return Math.round((this.processed / this.total) * 100);
    }
  },
  methods: {
    async startIndexing(force = false) {
      try {
        await axios.post(`${API_BASE_URL}/api/index-build`, { force });
        this.status = 'in-progress';
        this.startPolling();
      } catch (error) {
        console.error('Error starting indexing:', error);
        this.status = 'error';
      }
    },
    async checkStatus() {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/indexing-status`);
        const { status, processed, total, currentFile } = response.data;
        this.status = status;
        this.processed = processed;
        this.total = total;
        this.currentFile = currentFile;
        // Stop polling if indexing is complete or errored.
        if (status !== 'in-progress') {
          this.stopPolling();
        }
      } catch (error) {
        console.error('Error checking indexing status:', error);
        this.stopPolling();
        this.status = 'error';
      }
    },
    startPolling() {
      this.pollingTimer = setInterval(() => {
        this.checkStatus();
      }, 2000); // Check every 2 seconds
    },
    stopPolling() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
      }
    }
  },
  async mounted() {
    // Check initial status.
    await this.checkStatus();
    // Start polling if indexing is in progress.
    if (this.status === 'in-progress') {
      this.startPolling();
    }
  },
  beforeUnmount() {
    this.stopPolling();
  }
};
</script>

<style>
.indexing-progress {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
}

.status {
  padding: 15px;
  border-radius: 6px;
}

.idle {
  background-color: #e8eaf6;
}

.in-progress {
  background-color: #e3f2fd;
}

.completed {
  background-color: #e8f5e9;
}

.error {
  background-color: #ffebee;
}

.progress-bar {
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar-fill {
  height: 100%;
  background-color: #4285f4;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #555;
}

.current-file {
  margin-top: 10px;
  font-size: 13px;
  color: #666;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.completion-message {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  color: #388e3c;
}

.error-message {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  color: #d32f2f;
}

.checkmark {
  display: inline-block;
  width: 24px;
  height: 24px;
  background-color: #4caf50;
  color: white;
  border-radius: 50%;
  text-align: center;
  line-height: 24px;
  margin-right: 10px;
}

.error-icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  background-color: #f44336;
  color: white;
  border-radius: 50%;
  text-align: center;
  line-height: 24px;
  margin-right: 10px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.start-button {
  background-color: #4285f4;
}

.rebuild-button {
  background-color: #4caf50;
}

.retry-button {
  background-color: #f44336;
}

button:hover {
  opacity: 0.9;
}
</style>
