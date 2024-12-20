<template>
  <div class="form-container">
    <button class="back-home-btn" @click="goToHome">返回主页</button>
    <div class="form-wrapper">
      <transition name="rotate" mode="out-in">
        <div v-if="isLogin" key="login" class="form-box">
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
        <div v-else key="register" class="form-box">
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
  </div>
</template>

<script>
import axios from 'axios'
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
      }
    }
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
          localStorage.setItem('userId', response.data.data.id);
          localStorage.setItem('user', JSON.stringify(response.data.data));
          this.$router.push('/'); // 跳转主页
        } else {
          this.showAlertMessage('登录失败: ' + response.data.msg, 'error');
        }
      }).catch(error => {
        console.error('Login error:', error);
        this.showAlertMessage('登录时发生错误', 'error');
      });
    },
    handleRegister() {
      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        alert('密码不一致');
        return;
      }
      const registerData = {
        name: this.registerForm.username,
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
  width: 100%;
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
  width: 120px;
}

.btn.primary {
  background-color: #007bff;
  color: #fff;
}

.form-wrapper {
  perspective: 1000px;
}

.rotate-enter-active, .rotate-leave-active {
  transition: transform 0.6s ease, opacity 0.6s ease;
}
.rotate-enter, .rotate-leave-to {
  transform: rotateY(180deg);
  opacity: 0;
}
.rotate-enter {
  transform: rotateY(-180deg);
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
