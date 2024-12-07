import { defineStore } from 'pinia';
import axios from 'axios';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null, // 用户信息对象
    isLoggedIn: false,
    playlists: [] // 添加 playlists 状态
  }),
  getters: {
    getUser: state => state.user, // 获取用户信息
    getIsLoggedIn: state => state.isLoggedIn, // 获取登录状态
    getPlaylists: state => state.playlists // 获取歌单
  },
  actions: {
    setUser(user) {
      this.user = user; // 设置用户信息
      this.isLoggedIn = !!user && !!user.id; // 更新登录状态
      if (user && user.id) {
        localStorage.setItem('userId', user.id);
        localStorage.setItem('user', JSON.stringify(user)); // 存储用户信息
      }
      console.log('setUser called, isLoggedIn:', this.isLoggedIn);
    },
    setPlaylists(playlists) {
      this.playlists = playlists;
    },
    fetchPlaylists() {
      const userId = localStorage.getItem('userId');
      if (userId) {
        axios.get('/playlist/list', { params: { userId } })
          .then(response => {
            if (response.data.code === 200) {
              this.setPlaylists(response.data.data);
            } else {
              console.error('获取歌单失败:', response.data.msg);
            }
          })
          .catch(error => {
            console.error('获取歌单错误:', error);
          });
      }
    },
    logout() {
      this.$patch({
        user: null,
        isLoggedIn: false,
        playlists: []
      });
      localStorage.removeItem('userId');
      localStorage.removeItem('user'); // 移除用户信息
      console.log('logout called, isLoggedIn:', this.isLoggedIn);
    },
    login(user) {
      this.setUser(user);
      this.fetchPlaylists(); // 登录后获取歌单
    },
    checkLoginStatus() {
      const userId = localStorage.getItem('userId');
      const user = localStorage.getItem('user');
      if (userId && user) {
        this.setUser(JSON.parse(user)); // 从本地存储中恢复用户信息
        this.fetchPlaylists(); // 恢复用户信息后获取歌单
      } else {
        this.logout();
      }
    },
    addToPlaylist(data) {
      axios.put('/playlist/music', data) // 使用正确的 PUT 请求端点
        .then(response => {
          if (response.data.code === 200) {
            this.fetchPlaylists(); // 添加成功后刷新歌单
            alert('已添加到歌单');
          } else {
            alert('添加到歌单失败1: ' + response.data.msg);
          }
        })
        .catch(error => {
          console.error('添加到歌单时发生错误:', error);
          alert('添加到歌单时发生错误');
        });
    },
    deleteSongFromPlaylist({ playlistId, musicId }) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const data = {
          playlistId,
          musicId,
          userId
        };
        return axios.put('/playlist/music', data) // 返回 Promise
          .then(response => {
            if (response.data.code === 0) {
              this.fetchPlaylists(); // 刷新歌单
              alert('已成功删除歌曲');
            } else {
              alert('删除歌曲失败: ' + response.data.msg);
            }
          })
          .catch(error => {
            console.error('删除歌单歌曲时发生错误:', error);
            alert('删除歌曲时发生错误');
          });
      } else {
        alert('请先登录');
      }
    }
  }
});
