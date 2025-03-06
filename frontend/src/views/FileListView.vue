<template>
  <div>
    <div class="sm:flex sm:items-center mb-6">
      <div class="sm:flex-auto">
        <h1 class="text-xl font-semibold text-gray-900">Google Drive Files</h1>
        <p class="mt-2 text-sm text-gray-700">
          Browse and manage your Google Drive files. Connect your account to search and view details.
        </p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <button @click="loadFiles" class="btn inline-flex items-center">
          <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Files
        </button>
      </div>
    </div>
    
    <!-- Filters -->
    <div class="bg-white shadow sm:rounded-lg mb-6">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg font-medium text-gray-900">Filter Files</h3>
        <div class="mt-4 grid grid-cols-1 gap-y-4 sm:grid-cols-3 sm:gap-x-6">
          <div>
            <label for="limit" class="block text-sm font-medium text-gray-700">Files per page</label>
            <select id="limit" v-model="limit" @change="loadFiles" class="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          
          <div>
            <label for="modified-after" class="block text-sm font-medium text-gray-700">Modified after</label>
            <input 
              type="date" 
              id="modified-after" 
              v-model="modifiedAfter"
              @change="loadFiles" 
              class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label for="modified-before" class="block text-sm font-medium text-gray-700">Modified before</label>
            <input 
              type="date" 
              id="modified-before" 
              v-model="modifiedBefore"
              @change="loadFiles" 
              class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div class="mt-5">
          <button @click="clearFilters" class="btn-secondary text-sm">
            Clear Filters
          </button>
        </div>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center my-12">
      <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-lg text-gray-500">Loading files...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="rounded-md bg-red-50 p-4 my-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ errorMessage }}</p>
          </div>
          <div class="mt-4">
            <button @click="loadFiles" class="btn-secondary text-sm">Try Again</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- No files state -->
    <div v-else-if="files.length === 0" class="bg-white shadow sm:rounded-lg my-6">
      <div class="px-4 py-12 sm:p-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No files found</h3>
        <p class="mt-1 text-sm text-gray-500">Either no files exist or you need to log in.</p>
      </div>
    </div>
    
    <!-- Files table -->
    <div v-else class="flex flex-col">
      <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th scope="col" class="relative px-6 py-3">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="file in files" :key="file.id">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ file.name }}</div>
                    <div class="text-sm text-gray-500">{{ file.mimeType }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ getOwnerName(file) }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ formatDate(file.modifiedTime) }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatSize(file.size) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <router-link :to="`/file/${file.id}`" class="text-blue-600 hover:text-blue-900">View</router-link>
                    <a v-if="file.webViewLink" :href="file.webViewLink" target="_blank" class="ml-3 text-gray-600 hover:text-gray-900">Open in Drive</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Pagination -->
    <div v-if="files.length > 0" class="flex items-center justify-between mt-6">
      <div class="flex-1 flex justify-between sm:hidden">
        <button 
          @click="prevPage" 
          :disabled="!hasPrevPage"
          :class="[hasPrevPage ? 'btn-secondary' : 'opacity-50 cursor-not-allowed btn-secondary']"
        >
          Previous
        </button>
        <button 
          @click="nextPage" 
          :disabled="!hasNextPage"
          :class="[hasNextPage ? 'btn-secondary' : 'opacity-50 cursor-not-allowed btn-secondary']"
        >
          Next
        </button>
      </div>
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Showing page <span class="font-medium">{{ currentPage }}</span>
          </p>
        </div>
        <div>
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              @click="prevPage"
              :disabled="!hasPrevPage"
              class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              :class="{ 'opacity-50 cursor-not-allowed': !hasPrevPage }"
            >
              <span class="sr-only">Previous</span>
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
            <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
              {{ currentPage }}
            </span>
            <button
              @click="nextPage"
              :disabled="!hasNextPage"
              class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              :class="{ 'opacity-50 cursor-not-allowed': !hasNextPage }"
            >
              <span class="sr-only">Next</span>
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'FileListView',
  data() {
    return {
      files: [],
      nextPageToken: null,
      prevPageTokens: [],
      currentPage: 1,
      limit: 10,
      modifiedAfter: '',
      modifiedBefore: '',
      loading: false,
      error: null,
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000'
    };
  },
  computed: {
    hasNextPage() {
      return !!this.nextPageToken;
    },
    hasPrevPage() {
      return this.prevPageTokens.length > 0;
    }
  },
  mounted() {
    this.loadFiles();
  },
  methods: {
    async loadFiles() {
      this.loading = true;
      this.error = null;
      
      try {
        // Format dates as ISO strings
        const formattedAfter = this.modifiedAfter ? new Date(this.modifiedAfter).toISOString() : null;
        const formattedBefore = this.modifiedBefore ? new Date(this.modifiedBefore).toISOString() : null;
        
        const response = await axios.get(`${this.apiBaseUrl}/api/files`, {
          params: { 
            limit: this.limit,
            offset: this.nextPageToken,
            modifiedAfter: formattedAfter,
            modifiedBefore: formattedBefore
          }
        });
        
        this.files = response.data.files || [];
        this.nextPageToken = response.data.nextPageToken;
      } catch (error) {
        console.error('Error loading files:', error);
        if (error.response && error.response.status === 401) {
          this.error = "Please log in with your Google account to view your files.";
        } else {
          this.error = error.response?.data?.error || 'Failed to load files';
        }
      } finally {
        this.loading = false;
      }
    },
    nextPage() {
      if (this.nextPageToken) {
        this.prevPageTokens.push(this.nextPageToken);
        this.currentPage++;
        this.loadFiles();
      }
    },
    prevPage() {
      if (this.prevPageTokens.length > 0) {
        this.nextPageToken = this.prevPageTokens.pop();
        this.currentPage--;
        this.loadFiles();
      }
    },
    clearFilters() {
      this.modifiedAfter = '';
      this.modifiedBefore = '';
      this.nextPageToken = null;
      this.prevPageTokens = [];
      this.currentPage = 1;
      this.loadFiles();
    },
    getOwnerName(file) {
      return file.owners && file.owners.length > 0
        ? file.owners[0].displayName || file.owners[0].emailAddress
        : 'Unknown';
    },
    formatDate(dateString) {
      if (!dateString) return 'Unknown';
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },
    formatSize(bytes) {
      if (!bytes) return 'Unknown';
      
      bytes = parseInt(bytes);
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes === 0) return '0 Bytes';
      
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
    }
  }
}
</script>

