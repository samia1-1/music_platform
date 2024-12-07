import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import PersonalInformation from '@/views/PersonalInformation.vue';
// import SelectPlaylistComponent from '@/components/SelectPlaylistComponent.vue'; // 如果作为独立路由使用

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/personal-information',
    name: 'personal-information',
    component: PersonalInformation
  },
  // 如果需要作为独立页面
  // {
  //   path: '/select-playlist',
  //   name: 'select-playlist',
  //   component: SelectPlaylistComponent
  // },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
