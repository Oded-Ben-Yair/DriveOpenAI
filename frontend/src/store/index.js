import { createStore } from 'vuex';
import axios from 'axios';

// Base URL for backend API (configurable via environment variable in production)
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';

export default createStore({
  state: {
    files: [],          // List of files from Google Drive
    selectedFile: null, // Currently selected file details
    loading: false,     // Loading state for async operations
    error: null         // Error state for failed operations
  },
  mutations: {
    SET_FILES(state, files) {
      state.files = files || []; // Ensure files is always an array
    },
    SET_SELECTED_FILE(state, file) {
      state.selectedFile = file || null; // Ensure null if no file
    },
    CLEAR_SELECTED_FILE(state) {
      state.selectedFile = null;
    },
    SET_LOADING(state, status) {
      state.loading = status; // Toggle loading state
    },
    SET_ERROR(state, error) {
      state.error = error; // Store error message
    }
  },
  actions: {
    async fetchFiles({ commit }, { limit = 10, offset = 0 } = {}) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/files`, {
          params: { limit, offset }
        });
        commit('SET_FILES', response.data.files);
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to fetch files');
        throw error; // Re-throw for component-level handling if needed
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async fetchFileById({ commit }, id) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/files/${id}`);
        commit('SET_SELECTED_FILE', response.data);
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to fetch file');
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async deleteFile({ commit }, id) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        await axios.delete(`${API_BASE_URL}/api/files/${id}`);
        commit('CLEAR_SELECTED_FILE');
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to delete file');
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async askAI({ commit }, question) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        const response = await axios.post(`${API_BASE_URL}/api/ai-query`, { question });
        return response.data.answer;
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to get AI response');
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    }
  }
});