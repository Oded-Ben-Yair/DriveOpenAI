<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-primary-600 dark:text-primary-400">DriveOpenAI</h1>
            <nav class="flex space-x-6">
              <router-link to="/" class="nav-link">Home</router-link>
              <router-link to="/files" class="nav-link">Files</router-link>
              <router-link to="/chat" class="nav-link">Smart Chat</router-link>
              <router-link to="/login" class="nav-link">Login</router-link>
            </nav>
          </div>
          <div class="flex items-center">
            <AuthStatus />
            <DarkModeToggle class="ml-4" />
          </div>
        </div>
      </div>
    </header>
    
    <main>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <router-view />
      </div>
    </main>
    
    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p class="text-center text-gray-500 dark:text-gray-400 text-sm">
          DriveOpenAI - Your Personal AI Assistant for Google Drive
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
import AuthStatus from './components/AuthStatus.vue';
import DarkModeToggle from './components/DarkModeToggle.vue';

export default {
  name: 'App',
  components: {
    AuthStatus,
    DarkModeToggle
  }
};
</script>

<style>
/* Base styles for dark mode support */
.dark-mode {
  --color-primary: #3b82f6;
  --color-background: #111827;
  --color-text: #f3f4f6;
}

/* Global styles */
body {
  transition: background-color 0.3s ease;
}

body.dark-mode {
  background-color: var(--color-background);
  color: var(--color-text);
}
</style>
