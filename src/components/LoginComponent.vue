<template>
  <div class="form-container">
    <button class="back-home-btn" @click="goToHome">返回主页</button>
    <transition name="slide-fade">
      <div v-if="isLogin" class="form-box">
        <form @submit.prevent="handleLogin">
          <div class="form-item">
            <label for="username">用户名</label>
            <input type="text" id="username" v-model="loginForm.username" autocomplete="username" />
          </div>
          <div class="form-item">
            <label for="password">密码</label>
            <input type="password" id="password" v-model="loginForm.password" autocomplete="current-password" />
          </div>
          <div class="form-item">
            <button type="submit" class="btn primary">登录</button>
            <button type="button" class="btn" @click="toggleForm">切换到注册</button>
          </div>
        </form>
      </div>
    </transition>
    <transition name="slide-fade">
      <div v-if="!isLogin" class="form-box">
        <form @submit.prevent="handleRegister">
          <div class="form-item">
            <label for="register-username">用户名</label>
            <input type="text" id="register-username" v-model="registerForm.username" autocomplete="username" />
          </div>
          <div class="form-item">
            <label for="register-password">密码</label>
            <input type="password" id="register-password" v-model="registerForm.password" autocomplete="new-password" />
          </div>
          <div class="form-item">
            <label for="confirm-password">确认密码</label>
            <input type="password" id="confirm-password" v-model="registerForm.confirmPassword" autocomplete="new-password" />
          </div>
          <div class="form-item">
            <button type="submit" class="btn primary">注册</button>
            <button type="button" class="btn" @click="toggleForm">切换到登录</button>
          </div>
        </form>
      </div>
    </transition>
  </div>
</template>

<script>
import axios from 'axios'
import { useUserStore } from '@/store'; // 确保已导入 useUserStore

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
      }
    }
  },
  methods: {
    toggleForm() {
      this.isLogin = !this.isLogin;
    },
    handleLogin() {
      const loginData = {
        name: this.loginForm.username, // 确保传递 name
        password: this.loginForm.password
      };
      console.log('Login request data:', loginData); // 添加日志输出以检查请求体内容
      axios.post('/user/login', loginData).then(response => {
        console.log('Login response:', response); // 添加日志输出以检查响应内容
        console.log('Login response data:', response.data); // 添加日志输出以检查响应数据
        if (response.data && response.data.code === 200 && response.data.msg === "null") { // 确保正确判断响应数据
          console.log('Login successful'); // 添加日志输出
          const userStore = useUserStore();
          userStore.setUser(response.data.data);
          // 存储 userId 和用户信息到 localStorage
          localStorage.setItem('userId', response.data.data.id);
          localStorage.setItem('user', JSON.stringify(response.data.data));
          console.log('UserId stored in localStorage:', response.data.data.id); // 添加日志输出
          console.log('User store state after login:', userStore.$state); // 输出 userStore 的状态
          this.$router.push('/'); // 跳转到主页
        } else {
          console.error('Login failed:', response.data.msg); // 添加详细的错误日志输出
          console.log('Actual msg value:', response.data.msg); // 输出 msg 的实际值
          this.showAlertMessage('登录失败: ' + response.data.msg);
        }
      }).catch(error => {
        console.error('Login error:', error); // 添加详细的错误日志输出
        if (error.response) {
          console.error('Error response data:', error.response.data);
          console.error('Error response status:', error.response.status);
          console.error('Error response headers:', error.response.headers);
          this.showAlertMessage('登录时发生错误: ' + error.response.data.msg, 'error');
        } else {
          this.showAlertMessage('登录时发生错误', 'error');
        }
      });
    },
    checkLoginStatus() {
      const userId = localStorage.getItem('userId');
      if (userId) {
        axios.post('/user/status', { userId }).then(response => {
          if (response.data.code === 0) {
            console.log('登录状态正常');
          } else {
            console.log('登录状态异常');
          }
        }).catch(error => {
          console.error('检查登录状态时发生错误', error);
        });
      }
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
          // this.showAlertMessage('获取用户信息时发生错误', 'error');
        });
      }
    },
    handleRegister() {
      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        alert('密码不一致');
        return;
      }
      const registerData = {
        name: this.registerForm.username, // 修改 username 为 name
        password: this.registerForm.password
      };
      axios.post('/user/register', registerData).then(response => {
        if (response.data.code === 200) {
          alert('注册成功，请登录');
          this.isLogin = true;
        } else {
          alert('注册失败');
        }
      }).catch(error => {
        console.error(error);
        alert('注册时发生错误');
      });
    },
    goToHome() {
      this.$router.push('/');
    },
    showAlertMessage(message, type = 'info') {
      this.alertMessage = message;
      this.alertType = type;
      this.showAlert = true;
      setTimeout(() => {
        this.showAlert = false;
      }, 3000);
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
}

.form-item {
  margin-bottom: 15px;
}

.form-item label {
  display: block;
  margin-bottom: 5px;
}

.form-item input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

.btn {
  padding: 10px 15px;
  margin-right: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn.primary {
  background-color: #007bff;
  color: #fff;
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
