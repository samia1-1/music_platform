<template>
  <div class="personal-info-container">
    <button class="back-home-btn" @click="goToHome">返回首页</button>
    <div v-if="!userStore.getIsLoggedIn" class="alert-box error">请先登录以查看个人信息和歌单。</div>
    <div v-else>
      <div class="tabs">
        <button :class="{ active: activeTab === 'personal-info' }" @click="toggleTab('personal-info')">个人信息</button>
        <button :class="{ active: activeTab === 'my-playlist' }" @click="toggleTab('my-playlist')">我的歌单</button>
      </div>
      <div v-if="activeTab === 'personal-info'">
        <PersonalInformationComponent />
      </div>
      <div v-if="activeTab === 'my-playlist'">
        <PlaylistComponent :playlists="playlists" @deletePlaylist="deletePlaylist" @deleteSong="deleteSong" @refreshPlaylists="fetchPlaylists" />
        <div class="create-playlist">
          <input type="text" v-model="newPlaylistName" placeholder="输入歌单名称" />
          <button @click="createPlaylist">创建歌单</button>
        </div>
      </div>
      <button @click="toggleTab(activeTab === 'personal-info' ? 'my-playlist' : 'personal-info')">切换</button>
      <button class="logout-btn" @click="logout">退出登录</button>
    </div>
    <transition name="fade">
      <div v-if="showAlert" :class="['alert-box', alertType]">{{ alertMessage }}</div>
    </transition>
  </div>
</template>

<script>
import { useUserStore } from '@/store'
import PersonalInformationComponent from '@/components/PersonalInformationComponent.vue'
import PlaylistComponent from '@/components/PlaylistComponent.vue'
import axios from 'axios'

export default {
  components: {
    PersonalInformationComponent,
    PlaylistComponent
  },
  data() {
    return {
      activeTab: 'personal-info',
      newPlaylistName: '',
      showAlert: false,
      alertMessage: '',
      alertType: '',
      playlists: []
    }
  },
  computed: {
    user() {
      return this.userStore.getUser // 更新为 getUser
    },
    playlists() {
      return this.userStore.getPlaylists // 更新为 getPlaylists
    }
  },
  created() {
    try {
      this.userStore = useUserStore();
      if (this.userStore.getIsLoggedIn) {
        this.fetchUserInfo();
        this.fetchPlaylists(); // 自动查询用户已有歌单
      }
    } catch (error) {
      console.error('Error in created hook:', error);
    }
  },
  updated() {
    try {
      console.log('PersonalInformation updated')
    } catch (error) {
      console.error('Error in updated hook:', error)
    }
  },
  methods: {
    toggleTab(tab) {
      this.activeTab = tab;
      if (this.activeTab === 'my-playlist') {
        this.fetchPlaylists(); // 切换到“我的歌单”标签时获取歌单
      }
    },
    fetchUserInfo() {
      const userId = localStorage.getItem('userId');
      if (userId) {
        console.log('Fetching user info with userId:', userId); // 添加日志输出
        axios.get('/user', { params: { userId: userId } }).then(response => {
          console.log('User info response:', response); // 添加日志输出
          if (response.data.code === 200) {
            this.userStore.setUser(response.data.data);
          } else {
            this.showAlertMessage('获取用户信息失败: ' + response.data.msg, 'error');
          }
        }).catch(error => {
          console.error('Fetch user info error:', error);
          this.showAlertMessage('获取用户信息时发生错误', 'error');
        });
      }
    },
    fetchPlaylists() {
      const userId = localStorage.getItem('userId');
      if (userId) {
        axios.get('/playlist/list', { params: { userId } }).then(response => {
          console.log('Fetch playlists response:', response); // 添加日志输出
          if (response.data.code === 200) {
            this.userStore.setPlaylists(response.data.data);
          } else {
            this.showAlertMessage('获取歌单失败: ' + response.data.msg, 'error');
          }
        }).catch(error => {
          console.error(error);
          this.showAlertMessage('获取歌单时发生错误', 'error');
        });
      } else {
        this.showAlertMessage('请先登录以查看歌单', 'error');
      }
    },
    createPlaylist() {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const data = {
          userId: userId,
          name: this.newPlaylistName
        };
        axios.post('/playlist', data).then(response => {
          if (response.data.code === 200) {
            this.showAlertMessage('歌单创建成功', 'success');
            this.fetchPlaylists();
            this.newPlaylistName = '';
          } else {
            this.showAlertMessage('歌单创建失败: ' + response.data.msg, 'error');
          }
        }).catch(error => {
          console.error(error);
          this.showAlertMessage('创建歌单时发生错误', 'error');
        });
      }
    },
    deletePlaylist(id) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const data = {
          userId: userId,
          playlistId: id
        };
        axios.delete('/playlist', { data }).then(response => {
          if (response.data.code === 200) {
            this.showAlertMessage('歌单删除成功', 'success');
            this.fetchPlaylists();
          } else {
            this.showAlertMessage('歌单删除失败: ' + response.data.msg, 'error');
          }
        }).catch(error => {
          console.error(error);
          this.showAlertMessage('删除歌单时发生错误', 'error');
        });
      }
    },
    deleteSong(playlistId, songId) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const data = {
          userId: userId,
          playlistId: playlistId,
          musicId: songId
        };
        axios.delete('/playlist/music', { data }).then(response => {
          if (response.data.code === 200) {
            this.showAlertMessage('歌曲删除成功', 'success');
            this.fetchPlaylists();
          } else {
            this.showAlertMessage('歌曲删除失败: ' + response.data.msg, 'error');
          }
        }).catch(error => {
          console.error(error);
          this.showAlertMessage('删除歌曲时发生错误', 'error');
        });
      }
    },
    showAlertMessage(message, type = 'info') {
      this.alertMessage = message;
      this.alertType = type;
      this.showAlert = true;
      setTimeout(() => {
        this.showAlert = false;
      }, 3000);
    },
    goToHome() {
      this.$router.push('/');
    },
    logout() {
      this.userStore.logout();
      localStorage.removeItem('user');
      localStorage.removeItem('token'); // 清除本地存储中的 token
      this.userStore.setUser(null); // 清空用户信息
      this.$router.push('/login');
    },
    updateUserInfo(field) {
      const updatedData = { [field]: this.editableUser[field] };
      const data = {
        userId: this.editableUser.userId,
        ...updatedData
      };
      axios.put('/user', data)
        .then(response => {
          if (response.data.code === 200) {
            alert('信息更新成功');
            this.fetchUserInfo(); // 更新成功后重新获取用户信息
          } else {
            alert('信息更新失败: ' + response.data.msg);
          }
        })
        .catch(error => {
          console.error(error);
          alert('更新信息时发生错误');
        });
    },
    // ...其他方法...
  }
}
</script>

<style scoped>
.personal-info-container {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 20px auto;
  width: 50%;
  text-align: center;
}

.tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.tabs button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: #fff;
  cursor: pointer;
  margin: 0 5px;
}

.tabs button.active {
  background-color: #0056b3;
}

button {
  margin-top: 20px;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: #fff;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

.create-playlist {
  margin-top: 20px;
}

.create-playlist input {
  padding: 10px;
  margin-right: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.create-playlist button {
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: #fff;
  cursor: pointer;
}

.create-playlist button:hover {
  background-color: #0056b3;
}

.alert-box {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 5px;
  color: #fff;
  z-index: 1000;
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.alert-box.info {
  background-color: #007bff;
}
.alert-box.success {
  background-color: #28a745;
}
.alert-box.error {
  background-color: #dc3545;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

.back-home-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.3s;
}
.back-home-btn:hover {
  background-color: #0056b3;
}

.logout-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  background-color: #dc3545;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.3s;
}
.logout-btn:hover {
  background-color: #c82333;
}
</style>
