<template>
  <div class="personal-info">
    <div class="info-item">
      <label for="username"><strong>名字:</strong></label>
      <input type="text" id="username" v-model="editableUser.name" />
      <button @click="updateUserInfo">修改</button>
    </div>
    <div class="info-item">
      <label for="gender"><strong>性别:</strong></label>
      <input type="text" id="gender" v-model="editableUser.gender" />
      <button @click="updateUserInfo">修改</button>
    </div>
    <div class="info-item">
      <label for="hobby"><strong>爱好:</strong></label>
      <input type="text" id="hobby" v-model="editableUser.hobby" />
      <button @click="updateUserInfo">修改</button>
    </div>
    <div class="info-item">
      <label for="password"><strong>密码:</strong></label>
      <input type="password" id="password" v-model="editableUser.password" />
      <button @click="updateUserInfo">修改</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useUserStore } from '@/store';
import { computed } from 'vue';

export default {
  name: 'PersonalInformationComponent',
  setup() {
    const userStore = useUserStore();
    const editableUser = computed(() => ({
      userId: userStore.getUser.id || '',
      name: userStore.getUser.name || '',
      gender: userStore.getUser.gender || '',
      hobby: userStore.getUser.hobby || '',
      password: '' // 确保密码字段存在
    }));

    const updateUserInfo = () => {
      const data = {
        userId: editableUser.value.userId,
        name: editableUser.value.name,
        gender: editableUser.value.gender,
        hobby: editableUser.value.hobby,
        password: editableUser.value.password // 添加密码字段
      };

      console.log('Updating user info with data:', data); // 添加日志输出
      axios.put(`/user`, data).then(response => {
        console.log('Update user info response:', response); // 添加日志输出
        if (response.data.code === 200) {
          userStore.fetchPlaylists(); // 更新用户信息后刷新歌单列表
          alert('信息更新成功');
          fetchUserInfo(); // 更新成功后重新获取用户信息
        } else {
          alert('信息更新失败: ' + response.data.msg);
        }
      }).catch(error => {
        console.error('Update user info error:', error);
        alert('更新信息时发生错误');
      });
    };

    const fetchUserInfo = () => {
      const userId = editableUser.value.userId;
      if (userId) {
        axios.get('/user', { params: { userId: userId } }).then(response => {
          userStore.setUser(response.data.data);
        }).catch(error => {
          console.error('Fetch user info error:', error);
          alert('获取用户信息时发生错误');
        });
      }
    };

    return {
      editableUser,
      updateUserInfo
    };
  },
};
</script>

<style scoped>
.personal-info {
  padding: 20px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: auto;
  width: 50%;
  text-align: center;
}

.info-item {
  margin: 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-item label {
  margin-right: 10px;
  font-weight: bold;
}

.info-item input {
  padding: 5px;
  margin-right: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  width: 200px;
}

.info-item button {
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.3s;
}

.info-item button:hover {
  background-color: #0056b3;
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
