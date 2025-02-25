import { createStore } from 'vuex';
import axios from 'axios';

export default createStore({
  state: {
    files: [],
    selectedFile: null,
  },
  mutations: {
    SET_FILES(state, files) {
      state.files = files;
    },
    SET_SELECTED_FILE(state, file) {
      state.selectedFile = file;
    },
    CLEAR_SELECTED_FILE(state) {
      state.selectedFile = null;
    },
  },
  actions: {
    async fetchFiles({ commit }, { limit = 10, offset = 0 } = {}) {
      // Adjust URL if your backend is different
      const response = await axios.get('http://localhost:3000/api/files', {
        params: { limit, offset },
      });
      commit('SET_FILES', response.data.files);
    },
    async fetchFileById({ commit }, id) {
      const response = await axios.get(`http://localhost:3000/api/files/${id}`);
      commit('SET_SELECTED_FILE', response.data);
    },
    async deleteFile({ commit }, id) {
      await axios.delete(`http://localhost:3000/api/files/${id}`);
      commit('CLEAR_SELECTED_FILE');
    },
    async askAI(_, question) {
      const response = await axios.post('http://localhost:3000/api/ai-query', { question });
      return response.data.answer;
    },
  },
});
