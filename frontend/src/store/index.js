import { createStore } from 'vuex'; 
import axios from 'axios';

// Base URL for backend API
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';

// Configure axios defaults
const configureAxiosAuth = () => {
  const token = localStorage.getItem('google_token');
  if (token) {
    axios.defaults.headers.common['x-google-token'] = token;
  }
};

export default createStore({
  state: {
    files: [],          // List of files from Google Drive
    selectedFile: null, // Currently selected file details
    loading: false,     // Loading state for async operations
    error: null,        // Error state for failed operations
    darkMode: false,    // Dark mode toggle
    isAuthenticated: false // Authentication status
  },
  
  mutations: {
    SET_FILES(state, files) {
      state.files = files || []; 
    },
    SET_SELECTED_FILE(state, file) {
      state.selectedFile = file || null;
    },
    CLEAR_SELECTED_FILE(state) {
      state.selectedFile = null;
    },
    SET_LOADING(state, status) {
      state.loading = status;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
    SET_DARK_MODE(state, isDark) {
      state.darkMode = isDark;
      localStorage.setItem('darkMode', isDark);
    },
    SET_AUTHENTICATED(state, status) {
      state.isAuthenticated = status;
    }
  },
  
  actions: {
    // Initialize app state from localStorage
    initialize({ commit }) {
      // Set dark mode from localStorage
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode !== null) {
        commit('SET_DARK_MODE', savedDarkMode === 'true');
      }
      
      // Configure axios with auth tokens
      configureAxiosAuth();
      
      // Check authentication status
      const token = localStorage.getItem('google_token');
      commit('SET_AUTHENTICATED', !!token);
    },
    
    // Toggle dark mode
    toggleDarkMode({ commit, state }) {
      commit('SET_DARK_MODE', !state.darkMode);
    },
    
    // Fetch files with pagination and filtering
    async fetchFiles({ commit }, { limit = 10, offset = 0, modifiedAfter = null, modifiedBefore = null } = {}) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        configureAxiosAuth();
        
        const response = await axios.get(`${API_BASE_URL}/api/files`, {
          params: { 
            limit, 
            offset,
            modifiedAfter,
            modifiedBefore
          }
        });
        
        commit('SET_FILES', response.data.files);
        return response.data;
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch files';
        commit('SET_ERROR', errorMsg);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // Fetch a single file by ID
    async fetchFileById({ commit }, id) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        configureAxiosAuth();
        
        const response = await axios.get(`${API_BASE_URL}/api/files/${id}`);
        commit('SET_SELECTED_FILE', response.data);
        return response.data;
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch file';
        commit('SET_ERROR', errorMsg);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // Delete a file
    async deleteFile({ commit }, id) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        configureAxiosAuth();
        
        await axios.delete(`${API_BASE_URL}/api/files/${id}`);
        commit('CLEAR_SELECTED_FILE');
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message || 'Failed to delete file';
        commit('SET_ERROR', errorMsg);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // Ask AI about files
    async askAI({ commit }, question) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        configureAxiosAuth();
        
        const response = await axios.post(`${API_BASE_URL}/api/ai-query`, { question });
        return response.data.answer;
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message || 'Failed to get AI response';
        commit('SET_ERROR', errorMsg);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // Set authentication status
    setAuthenticated({ commit }, status) {
      commit('SET_AUTHENTICATED', status);
    }
  }
});