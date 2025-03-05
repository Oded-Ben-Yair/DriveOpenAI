import { createRouter, createWebHistory } from 'vue-router';

// Import views
import WelcomePage from '../views/WelcomePage.vue';  // New welcome/landing page
import FileListView from '../views/FileListView.vue';
import FileDetailView from '../views/FileDetailView.vue';
// Removed AiQueryView since its functionality is now integrated into ChatView
import LoginView from '../views/LoginView.vue';
import ChatView from '../views/ChatView.vue'; // Unified Smart Chat interface

const routes = [
  { path: '/', name: 'Welcome', component: WelcomePage },  // Default landing page
  { path: '/files', name: 'Files', component: FileListView },
  { path: '/file/:id', name: 'FileDetail', component: FileDetailView, props: true },
  { 
    path: '/chat', 
    name: 'Chat', 
    component: ChatView,
    meta: { title: 'Smart Drive Assistant' }
  },
  { path: '/login', name: 'Login', component: LoginView }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
