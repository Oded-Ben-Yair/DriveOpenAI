<template>
  <div id="app">
    <header>
      <nav>
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/ai" class="nav-link">AI Assistant</router-link>
      </nav>
    </header>
    
    <!-- Auth status component -->
    <AuthStatus class="auth-status-container" />
    
    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
import AuthStatus from './components/AuthStatus.vue';

export default {
  name: 'App',
  components: {
    AuthStatus
  }
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

nav {
  display: flex;
  gap: 20px;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-weight: bold;
}

.nav-link.router-link-active {
  color: #4285f4;
}

.auth-status-container {
  margin-bottom: 20px;
}

main {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  min-height: 80vh;
}

.btn {
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn:hover {
  background-color: #3b78e7;
}

.btn-danger {
  background-color: #ea4335;
}

.btn-danger:hover {
  background-color: #d33426;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.input-group input,
.input-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>