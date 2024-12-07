import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import axios from 'axios';

const BASE_URL = 'http://192.168.111.250:8080';
axios.defaults.baseURL = BASE_URL;

// 添加 axios 请求拦截器
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Adding token to request headers');
      config.headers['token'] = token;
    }
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 可选：保留或移除响应拦截器
// axios.interceptors.response.use(
//   response => {
//     console.log('Response received:', response);
//     return response;
//   },
//   error => {
//     console.error('Response error:', error);
//     if (error.response) {
//       console.error('Error response data:', error.response.data);
//       console.error('Error response status:', error.response.status);
//       console.error('Error response headers:', error.response.headers);
//     }
//     return Promise.reject(error);
//   }
// );

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);
app.mount('#app');
