<template>
  <div class="login-page">
    <div class="login-container">
      <h1>Welcome to DriveOpenAI</h1>
      
      <div class="app-description">
        <p>Connect your Google Drive account to get started with AI-powered file analysis and insights.</p>
      </div>
      
      <div class="features">
        <div class="feature">
          <div class="feature-icon">📁</div>
          <h3>Browse Your Files</h3>
          <p>View, manage, and organize your Google Drive files</p>
        </div>
        
        <div class="feature">
          <div class="feature-icon">🤖</div>
          <h3>AI Assistant</h3>
          <p>Ask questions about your files and get intelligent answers</p>
        </div>
        
        <div class="feature">
          <div class="feature-icon">📊</div>
          <h3>File Insights</h3>
          <p>Get analytics and insights about your Drive content</p>
        </div>
      </div>
      
      <div class="auth-section">
        <a :href="`${apiBaseUrl}/auth/google`" class="login-button">
          <span class="google-icon">G</span>
          Connect with Google Drive
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginView',
  data() {
    return {
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000'
    };
  }
};
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}

.login-container {
  max-width: 800px;
  text-align: center;
}

h1 {
  color: #202124;
  margin-bottom: 16px;
}

.app-description {
  margin-bottom: 40px;
}

.app-description p {
  font-size: 18px;
  color: #5f6368;
  line-height: 1.5;
}

.features {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
}

.feature {
  flex: 1;
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.feature:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 36px;
  margin-bottom: 16px;
}

.feature h3 {
  margin: 0 0 10px;
  color: #202124;
}

.feature p {
  color: #5f6368;
  margin: 0;
}

.auth-section {
  margin-top: 40px;
}

.login-button {
  display: inline-flex;
  align-items: center;
  background-color: #4285f4;
  color: white;
  padding: 0 24px 0 0;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.login-button:hover {
  background-color: #3367d6;
}

.google-icon {
  background-color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 4px 0 0 4px;
  margin-right: 16px;
  color: #4285f4;
  font-weight: bold;
}

@media (max-width: 768px) {
  .features {
    flex-direction: column;
  }
}
</style>