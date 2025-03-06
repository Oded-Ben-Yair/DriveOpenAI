<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
    <div class="text-center px-4">
      <h1 class="text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
        Welcome to DriveOpenAI
      </h1>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Your personal AI assistant for Google Drive. Ask questions about your documents and receive instant, intelligent answers.
      </p>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Note: Indexing your files may take a moment, but we’ll have you up and running quickly!
      </p>
      <button 
        @click="$router.push('/chat')" 
        class="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Get Started
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "WelcomePage"
};
</script>

<style scoped>
/* You can add custom styles here if needed */
</style>

