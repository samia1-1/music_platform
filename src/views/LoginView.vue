<template>
  <div class="form-container">
    <button class="back-home-btn" @click="goToHome">返回主页</button>
    <transition name="slide-fade" mode="out-in">
      <div v-if="isLogin" class="form-box">
        <form @submit.prevent="handleLogin">
          <div class="form-item">
            <label for="username">用户名</label>
            <input type="text" id="username" v-model="loginForm.username" />
          </div>
          <div class="form-item">
            <label for="password">密码</label>
            <input type="password" id="password" v-model="loginForm.password" />
          </div>
          <div class="form-item">
            <button type="submit" class="btn primary">登录</button>
            <button type="button" class="btn" @click="toggleForm">切换到注册</button>
          </div>
          <div class="form-item">
            <button type="button" class="btn" @click="showSkipLoginModal">不登陆直接使用</button>
          </div>
        </form>
      </div>
    </transition>
    <transition name="slide-fade" mode="out-in">
      <div v-if="!isLogin" class="form-box">
        <form @submit.prevent="handleRegister">
          <div class="form-item">
            <label for="register-username">用户名</label>
            <input type="text" id="register-username" v-model="registerForm.username" />
          </div>
          <div class="form-item">
            <label for="register-password">密码</label>
            <input type="password" id="register-password" v-model="registerForm.password" />
          </div>
          <div class="form-item">
            <label for="confirm-password">确认密码</label>
            <input type="password" id="confirm-password" v-model="registerForm.confirmPassword" />
          </div>
          <div class="form-item">
            <button type="submit" class="btn primary">注册</button>
            <button type="button" class="btn" @click="toggleForm">切换到登录</button>
          </div>
          <div class="form-item">
            <button type="button" class="btn" @click="showSkipLoginModal">不注册直接使用</button>
          </div>
        </form>
      </div>
    </transition>
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <p>若您不进行登陆操作将无法获取到本网站所有服务</p>
        <button class="btn primary" @click="skipLogin">继续</button>
        <button class="btn" @click="closeModal">取消</button>
      </div>
    </div>
    <transition name="fade">
      <div v-if="showAlert" :class="['alert-box', alertType]">{{ alertMessage }}</div>
    </transition>
  </div>
</template>

<script>
import axios from 'axios';
import { useUserStore } from '@/store';

export default {
  data() {
    return {
      isLogin: true,
      loginForm: {
        username: '',
        password: ''
      },
      registerForm: {
        username: '',
        password: '',
        confirmPassword: ''
      },
      showModal: false,
      showAlert: false,
      alertMessage: '',
      alertType: ''
    };
  },
  methods: {
    toggleForm() {
      this.isLogin = !this.isLogin;
    },
    handleLogin() {
      const loginData = {
        name: this.loginForm.username,
        password: this.loginForm.password
      };
      axios.post('/user/login', loginData).then(response => {
        if (response.data && response.data.code === 200) {
          const userStore = useUserStore();
          userStore.setUser(response.data.data);
          userStore.fetchPlaylists(); // 登录后获取歌单列表
          this.$router.push('/'); // 跳转到主页
        } else {
          this.showAlertMessage('登录失败: ' + response.data.msg, 'error');
        }
      }).catch(error => {
        console.error('Login error:', error);
        this.showAlertMessage('登录时发生错误', 'error');
      });
    },
    handleRegister() {
      // 检查请求体是否包含 name 和 password 字段
      if (!this.registerForm.username || !this.registerForm.password) {
        this.showAlertMessage('用户名和密码不能为空', 'error');
        return;
      }

      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        this.showAlertMessage('密码不一致', 'error');
        return;
      }

      const registerData = {
        name: this.registerForm.username, // 修改 username 为 name
        password: this.registerForm.password
      };

      axios.post('/user/register', registerData).then(response => {
        if (response.data.code === 200) {
          this.showAlertMessage('注册成功，请登录', 'success');
          this.isLogin = true;
        } else {
          this.showAlertMessage('注册失败: ' + response.data.msg, 'error');
        }
      }).catch(error => {
        console.error(error);
        this.showAlertMessage('注册时发生错误', 'error');
      });
    },
    fetchUserInfo() {
      const userId = localStorage.getItem('userId');
      if (userId) {
        axios.get('/user', { params: { userId: userId } }).then(response => {
          const userStore = useUserStore();
          userStore.setUser(response.data.data);
          localStorage.setItem('user', JSON.stringify(response.data.data));
        }).catch(error => {
          console.error('Fetch user info error:', error);
          this.showAlertMessage('获取用户信息时发生错误', 'error');
        });
      }
    },
    showSkipLoginModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    skipLogin() {
      this.showModal = false;
      this.$router.push('/');
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
    addToPlaylist(playlistId) {
      if (this.currentSongId && playlistId) {
        const data = {
          playlistId: playlistId,
          musicId: this.currentSongId,
          userId: localStorage.getItem('userId') // 确保获取 userId
        };
        axios.put('/playlist/music', data) // 修改接口 URL
          .then(response => {
            if (response.data.code === 200) {
              this.showAlertMessage('已添加到歌单', 'success');
              this.closeAddToPlaylistModal();
            } else {
              this.showAlertMessage('添加到歌单失败2: ' + response.data.msg, 'error');
            }
          })
          .catch(error => {
            console.error('添加到歌单时发生错误:', error);
            this.showAlertMessage('添加到歌单时发生错误', 'error');
          });
      }
    },
  },
  created() {
    const userStore = useUserStore();
    userStore.checkLoginStatus();
    if (userStore.getIsLoggedIn) {
      userStore.fetchPlaylists(); // 检查登录状态后获取歌单
    }
  }
};
</script>

<style scoped>
.form-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.form-box {
  width: 300px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 10px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-item {
  margin-bottom: 15px;
}

.form-item label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-item input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.btn {
  padding: 10px 15px;
  margin-right: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn.primary {
  background-color: #007bff;
  color: #fff;
}

.btn:hover {
  background-color: #0056b3;
}

.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.5s ease;
}

.slide-fade-enter {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
</style>