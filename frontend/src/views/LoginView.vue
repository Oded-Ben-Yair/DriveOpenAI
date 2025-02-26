<template>
    <div class="login-view">
      <div class="login-container">
        <h1>Login to Drive OpenAI</h1>
        <p>Connect your Google account to access Drive files</p>
        
        <div class="login-button-container">
          <a :href="`${apiBaseUrl}/auth/google`" class="google-login-button">
            <img src="@/assets/google-logo.png" alt="Google" class="google-logo" />
            Sign in with Google
          </a>
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'LoginView',
    data() {
      return {
        error: null,
        apiBaseUrl: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000'
      };
    },
    mounted() {
      // Check if there's an error in the URL
      const params = new URLSearchParams(window.location.search);
      if (params.get('auth') === 'error') {
        this.error = params.get('message') || 'Authentication failed';
      }
      
      // Check if the authentication was successful
      if (params.get('auth') === 'success') {
        this.$router.push('/');
      }
    }
  };
  </script>
  
  <style scoped>
  .login-view {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 70vh;
  }
  
  .login-container {
    background-color: white;
    border-radius: 8px;
    padding: 40px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 400px;
    width: 100%;
  }
  
  .login-container h1 {
    margin-top: 0;
    color: #4285f4;
    margin-bottom: 10px;
  }
  
  .login-container p {
    color: #666;
    margin-bottom: 30px;
  }
  
  .login-button-container {
    margin: 30px 0;
  }
  
  .google-login-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    background-color: white;
    color: #757575;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    text-decoration: none;
    transition: background-color 0.2s;
  }
  
  .google-login-button:hover {
    background-color: #f5f5f5;
  }
  
  .google-logo {
    width: 18px;
    height: 18px;
    margin-right: 10px;
  }
  
  .error-message {
    color: #ea4335;
    background-color: #ffebee;
    padding: 10px;
    border-radius: 4px;
  }
  </style>