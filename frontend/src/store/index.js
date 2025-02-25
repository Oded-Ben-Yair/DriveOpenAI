import { createStore } from 'vuex';
import axios from 'axios';

export default createStore({
  state: {
    // Store the entire response from the backend
    filesData: { files: [], nextPageToken: null },
    selectedFile: null,
    aiAnswer: '',
  },
  mutations: {
    SET_FILES_DATA(state, data) {
      state.filesData = data;
    },
    SET_SELECTED_FILE(state, file) {
      state.selectedFile = file;
    },
    CLEAR_SELECTED_FILE(state) {
      state.selectedFile = null;
    },
    SET_AI_ANSWER(state, answer) {
      state.aiAnswer = answer;
    },
    CLEAR_AI_ANSWER(state) {
      state.aiAnswer = '';
    },
  },
  actions: {
    async fetchFiles({ commit }, { limit = 10, pageToken = null } = {}) {
      try {
        // Pass pageToken as offset; your backend uses "offset" to represent the page token.
        const response = await axios.get('http://localhost:3000/api/files', {
          params: { limit, offset: pageToken },
        });
        commit('SET_FILES_DATA', response.data);
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    },
    // Other actions for fetchFileById, deleteFile, editFile, askAI, etc.
  },
});
