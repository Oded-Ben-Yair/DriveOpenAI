<template>
    <div class="auth-status">
      <div v-if="loading" class="loading-status">
        <div class="spinner"></div>
        Checking authentication...
      </div>
      <div v-else-if="authenticated" class="authenticated">
        <span>✓ Authenticated with Google Drive</span>
      </div>
      <div v-else class="not-authenticated">
        <p>Not authenticated with Google Drive</p>
        <a :href="`${apiBaseUrl}/auth/google`" class="auth-button">Connect to Google Drive</a>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'AuthStatus',
    data() {
      return {
        authenticated: false,
        loading: true,
        apiBaseUrl: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000'
      };
    },
    async mounted() {
      await this.checkAuthStatus();
      
      // Also check auth from URL parameters
      const params = new URLSearchParams(window.location.search);
      
      if (params.get('auth') === 'success') {
        this.authenticated = true;
        
        // Save auth state to localStorage
        localStorage.setItem('auth', 'success');
        
        // Save token if provided
        const token = params.get('token');
        if (token) {
          try {
            const tokenObj = JSON.parse(decodeURIComponent(token));
            localStorage.setItem('google_token', JSON.stringify(tokenObj));
          } catch (e) {
            console.error('Error parsing token:', e);
          }
        }
        
        // Clean up URL
        if (window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    },
    methods: {
      async checkAuthStatus() {
        try {
          const response = await axios.get(`${this.apiBaseUrl}/auth/status`);
          this.authenticated = response.data.authenticated;
        } catch (error) {
          console.error('Error checking auth status:', error);
          this.authenticated = false;
        } finally {
          this.loading = false;
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .auth-status {
    background-color: #f5f5f5;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  
  .loading-status {
    display: flex;
    align-items: center;
    color: #666;
  }
  
  .spinner {
    border: 2px solid #f3f3f3;
    border-top: 2px solid #4285f4;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    animation: spin 1s linear infinite;
    margin-right: 10px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .authenticated {
    background-color: #e6f7e6;
    color: #2e7d32;
    padding: 10px;
    border-radius: 4px;
    font-weight: bold;
  }
  
  .not-authenticated {
    background-color: #ffebee;
    color: #c62828;
    padding: 15px;
    border-radius: 4px;
    text-align: center;
  }
  
  .auth-button {
    display: inline-block;
    background-color: #4285f4;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    text-decoration: none;
    margin-top: 10px;
    font-weight: bold;
  }
  
  .auth-button:hover {
    background-color: #3367d6;
  }
  </style>