<template>
  <div>
    <div class="mb-6">
      <router-link to="/files" class="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-900">
        <svg class="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        Back to files
      </router-link>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center my-12">
      <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-lg text-gray-500">Loading file details...</span>
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
            <p>{{ error }}</p>
          </div>
          <div class="mt-4">
            <button @click="fetchFileById(id)" class="btn-secondary text-sm">Try Again</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Not found state -->
    <div v-else-if="!file" class="bg-white shadow sm:rounded-lg my-6">
      <div class="px-4 py-12 sm:p-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">File not found</h3>
        <p class="mt-1 text-sm text-gray-500">The file you're looking for doesn't exist or you don't have permission to access it.</p>
        <div class="mt-6">
          <router-link to="/files" class="btn-secondary inline-flex items-center text-sm">
            View all files
          </router-link>
        </div>
      </div>
    </div>
    
    <!-- File details -->
    <div v-else>
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h3 class="text-lg leading-6 font-medium text-gray-900">{{ file.name }}</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">{{ file.mimeType }}</p>
          </div>
          <div class="flex space-x-3">
            <a 
              v-if="file.webViewLink" 
              :href="file.webViewLink" 
              target="_blank" 
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Open in Drive
            </a>
            <button 
              @click="confirmDelete" 
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
        <div class="border-t border-gray-200">
          <dl>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">File ID</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ file.id }}</dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Owner</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ getOwnerName(file) }}</dd>
            </div>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Size</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ formatSize(file.size) }}</dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Last modified</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ formatDate(file.modifiedTime) }}</dd>
            </div>
            <div v-if="file.description" class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Description</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ file.description }}</dd>
            </div>
          </dl>
        </div>
      </div>
      
      <!-- Delete confirmation modal -->
      <div v-if="showDeleteModal" class="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="showDeleteModal = false"></div>
          
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          
          <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Delete file
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    Are you sure you want to delete "{{ file.name }}"? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button 
                type="button" 
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                @click="deleteFile"
              >
                Delete
              </button>
              <button 
                type="button" 
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                @click="showDeleteModal = false"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'FileDetailView',
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      showDeleteModal: false
    };
  },
  computed: {
    ...mapState({
      file: state => state.selectedFile,
      loading: state => state.loading,
      error: state => state.error
    })
  },
  mounted() {
    this.fetchFileById(this.id);
  },
  methods: {
    ...mapActions(['fetchFileById', 'deleteFile']),
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
    },
    getOwnerName(file) {
      return file.owners && file.owners.length > 0
        ? file.owners[0].displayName || file.owners[0].emailAddress
        : 'Unknown';
    },
    confirmDelete() {
      this.showDeleteModal = true;
    },
    async deleteFile() {
      try {
        await this.$store.dispatch('deleteFile', this.id);
        this.showDeleteModal = false;
        this.$router.push('/files');
      } catch (error) {
        this.showDeleteModal = false;
      }
    }
  }
};
</script>

