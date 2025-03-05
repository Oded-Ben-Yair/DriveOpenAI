<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="max-w-3xl text-center p-6">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Welcome to DriveOpenAI</h1>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        DriveOpenAI is your personal AI assistant for Google Drive. Ask natural, conversational questions about your documents and get answers powered by cutting-edge Retrieval-Augmented Generation (RAG).
      </p>
      <ul class="text-left mx-auto max-w-md text-gray-600 dark:text-gray-400 mb-6 list-disc pl-5">
        <li>Modern, chat-like interface (inspired by ChatGPT)</li>
        <li>Dark/light mode toggle for your comfort</li>
        <li>Visual progress indicators during document indexing</li>
        <li>True semantic search with vector embeddings</li>
        <li>Conversation memory for context-aware responses</li>
        <li>Document-focused mode for targeted queries</li>
        <li>Robust error handling and clear user feedback</li>
      </ul>
      <button 
        @click="$router.push('/chat')" 
        class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Get Started
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WelcomePage'
};
</script>

<style scoped>
/* Add any additional custom styles here if needed */
</style>
