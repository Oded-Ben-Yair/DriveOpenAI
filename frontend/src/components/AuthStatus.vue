<template>
  <div>
    <div v-if="loading" class="flex items-center text-gray-500">
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Checking auth...</span>
    </div>
    
    <div v-else-if="authenticated" class="flex items-center space-x-2">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <svg class="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
          <circle cx="4" cy="4" r="3" />
        </svg>
        Authenticated
      </span>
      <button @click="logout" class="text-sm text-gray-600 hover:text-gray-900">Logout</button>
    </div>
    
    <div v-else>
      <a :href="`${apiBaseUrl}/auth/google`" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
        <svg class="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
        </svg>
        Connect with Google
      </a>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AuthStatus',
  data() {
    return {
      authenticated: false,
      loading: true,
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000'
    };
  },
  async mounted() {
    await this.checkAuthStatus();
    
    // Also check auth from URL parameters
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('auth') === 'success') {
      this.authenticated = true;
      
      // Save auth state to localStorage
      localStorage.setItem('auth', 'success');
      
      // Save token if provided
      const token = params.get('token');
      if (token) {
        try {
          const tokenObj = JSON.parse(decodeURIComponent(token));
          localStorage.setItem('google_token', JSON.stringify(tokenObj));
          
          // Set token in store for future API calls
          this.$store.commit('SET_TOKEN', tokenObj);
        } catch (e) {
          console.error('Error parsing token:', e);
        }
      }
      
      // Clean up URL
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  },
  methods: {
    async checkAuthStatus() {
      try {
        // First check localStorage
        const savedToken = localStorage.getItem('google_token');
        if (savedToken) {
          try {
            const tokenObj = JSON.parse(savedToken);
            // Set the token in axios headers for future requests
            axios.defaults.headers.common['x-google-token'] = savedToken;
            // Also store in Vuex
            this.$store.commit('SET_TOKEN', tokenObj);
          } catch (e) {
            console.error('Error parsing saved token:', e);
          }
        }
        
        const response = await axios.get(`${this.apiBaseUrl}/auth/status`);
        this.authenticated = response.data.authenticated;
        
        // If not authenticated but we have a token, remove it
        if (!this.authenticated && savedToken) {
          localStorage.removeItem('google_token');
          delete axios.defaults.headers.common['x-google-token'];
          this.$store.commit('SET_TOKEN', null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        this.authenticated = false;
      } finally {
        this.loading = false;
      }
    },
    
    logout() {
      localStorage.removeItem('auth');
      localStorage.removeItem('google_token');
      delete axios.defaults.headers.common['x-google-token'];
      this.$store.commit('SET_TOKEN', null);
      this.authenticated = false;
      
      // Redirect to login page
      this.$router.push('/login');
    }
  }
};
</script>