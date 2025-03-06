import { createRouter, createWebHistory } from 'vue-router';

// Import views
import FileListView from '../views/FileListView.vue';
import FileDetailView from '../views/FileDetailView.vue';
import AiQueryView from '../views/AiQueryView.vue';
import LoginView from '../views/LoginView.vue';
import ChatView from '../views/ChatView.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: FileListView
  },
  {
    path: '/file/:id',
    name: 'FileDetail',
    component: FileDetailView,
    props: true
  },
  {
    path: '/ai',
    name: 'AiQuery',
    component: AiQueryView
  },
  {
    path: '/chat',
    name: 'Chat',
    component: ChatView
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;