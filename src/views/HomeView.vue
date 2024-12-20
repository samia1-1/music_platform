<template>
  <div>
    <nav class="menu">
      <a :class="{ active: activeIndex === '1' }" @click="activeIndex = '1'">首页</a>
      <a v-if="isLoggedIn" :class="{ active: activeIndex === '2' }" @click="goToPersonalInfo">我的</a>
      <a v-if="!isLoggedIn" :class="{ active: activeIndex === '3' }" @click="goToLogin">登录</a>
      
      <!-- 合并搜索框和切换按钮 -->
      <div class="search-container">
        <button @click="toggleSearchType" class="toggle-search-btn">
          {{ searchType === 'music' ? '音乐' : 'MV' }}
        </button>
        <form @submit.prevent="handleSearch" class="search-form">
          <input type="text" v-model="searchQuery" :placeholder="searchType === 'music' ? '搜索音乐' : '搜索 MV'" />
          <button type="submit">搜索</button>
        </form>
      </div>
    </nav>
    <div class="content">
      <div class="sidebar">
        <h3>分类</h3>
        <ul>
          <li v-for="category in categories" :key="category" @click="selectCategory(category)" :class="{ selected: category === selectedCategory }">{{ category }}</li>
        </ul>
      </div>
      <div class="main-content" v-if="selectedCategory">
        <div v-if="searchType === 'music'" class="music-section">
          <h2>音乐</h2>
          <div class="navigation">
            <button @click="prevMusic">←</button>
            <transition-group name="slide-fade" tag="div" class="music-list">
                <div v-for="music in displayedResults" :key="music.id" class="music-item" @click="showMusicDetails(music.id)">
                  <div class="music-card">
                    <img :src="music.photo" alt="music photo" class="music-photo" />
                    <h3>{{ music.name }}</h3>
                    <p>作曲: {{ music.writeMusic }}</p>
                    <p>歌手: {{ music.singer }}</p>
                    <!-- <button @click.stop="openAddToPlaylistModal(music.id)" class="btn add-playlist-btn">加入我的歌单</button> -->
                  </div>
                </div>
            </transition-group>
            <button @click="nextMusic">→</button>
          </div>
        </div>
        <div v-else class="mv-section">
          <h2>MV</h2>
          <div class="navigation">
            <button @click="prevMV">←</button>
            <transition-group name="slide-fade" tag="div" class="mv-list">
              <div v-for="mv in displayedResults" :key="mv.id" class="mv-item" @click="showMVDetails(mv.id)">
                <div class="mv-card">
                  <img :src="mv.photo" alt="mv photo" class="mv-photo" />
                  <h3>{{ mv.name }}</h3>
                  <p>描述: {{ mv.describe }}</p>
                  <p>作者: {{ mv.author }}</p>
                </div>
              </div>
            </transition-group>
            <button @click="nextMV">→</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showDetailsModal" class="modal">
      <div class="modal-content">
        <div class="song-details">
          <div class="modal-body">
            <div class="details-left">
              <h3>{{ detailsType === 'music' ? details.name : details.name }}</h3>
              <p v-if="detailsType === 'music'"><strong>作曲:</strong> {{ details.writeMusic }}</p>
              <p v-if="detailsType === 'music'"><strong>歌手:</strong> {{ details.singer }}</p>
              <p v-if="detailsType === 'mv'"><strong>描述:</strong> {{ details.describe }}</p>
              <p v-if="detailsType === 'mv'"><strong>作者:</strong> {{ details.author }}</p>
              <img v-if="detailsType === 'music'":src="details.photo" alt="photo" class="music-photo" />
              <audio v-if="detailsType === 'music'" :src="details.audio" controls></audio>
              <video v-if="detailsType === 'mv'" :src="details.video" controls></video>
              <button class="btn primary" @click="closeDetailsModal">关闭</button>
              <button v-if="detailsType === 'music'" class="btn secondary" @click="openAddToPlaylistModal(details.id)">加入我的歌单</button>
            </div>
            <div class="lyrics">
              <h3>歌词</h3>
              <p>{{ songLyrics }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showPlaylistModal" class="modal">
      <div class="modal-content">
        <PlaylistComponent 
          :playlists="playlists" 
          :currentSongId="currentSongId" 
          @refreshPlaylists="fetchPlaylists" 
          @closeModal="showPlaylistModal = false"
        />
        <button @click="showPlaylistModal = false" class="btn secondary">关闭</button>
      </div>
    </div>
    <div v-if="showAlert" class="alert-box" :class="alertType">{{ alertMessage }}</div>
    <div v-if="showAddToPlaylistModal" class="modal">
      <div class="modal-content">
        <PlaylistComponent 
          ref="playlistComponentRef" 
          :currentSongId="currentSongId" 
          :playlists="playlists" 
          @refreshPlaylists="fetchPlaylists" 
          @closeModal="closeAddToPlaylistModal"
          @deleteSong="handleDeleteSong" 
        />
        <button @click="closeAddToPlaylistModal" class="btn secondary">关闭</button>
      </div>
    </div>
    <!-- 新增内嵌的选择歌单盒子 -->
    <div v-if="showSelectPlaylistBox" class="select-playlist-box">
      <div class="modal-content">
        <h2>选择歌单</h2>
        <ul class="playlist-list">
          <li 
            v-for="playlist in userStore.playlists" 
            :key="playlist.id" 
            @click="addToPlaylist(playlist.id)" 
            class="playlist-item"
          >
            {{ playlist.name }}
          </li>
        </ul>
        <button @click="closeSelectPlaylistBox" class="btn secondary">关闭</button>
      </div>
    </div>

    <!-- 搜索结果弹窗 -->
    <div v-if="showSearchResultsModal" class="modal">
      <div class="modal-content">
        <h2>搜索结果</h2>
        <button @click="closeSearchResultsModal" class="btn secondary">关闭</button>
        <div v-if="searchResults.length > 0">
          <ul>
            <li v-for="item in searchResults" :key="item.id">
              <!-- 根据搜索类型显示不同内容 -->
              <template v-if="searchType === 'music'">
                {{ item.name }} - {{ item.singer }}
              </template>
              <template v-else>
                {{ item.name }} - {{ item.author }}
              </template>
            </li>
          </ul>
        </div>
        <div v-else>
          <p>没有找到相关结果。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '@/store';
import axios from 'axios';
import PlaylistComponent from '@/components/PlaylistComponent.vue';
import { ref } from 'vue'; // 引入 ref

export default {
  components: {
    PlaylistComponent,
  },
  data() {
    return {
      activeIndex: '1',
      categories: [],
      selectedCategory: '',
      musicList: [],
      mvList: [],
      musicPage: 1, // 页码从1开始
      mvPage: 1,
      itemsPerPage: 3, // 确保每页显示3个
      showDetailsModal: false,
      details: {},
      showPlaylistModal: false, // 保留现有模态框
      showSelectPlaylistBox: false, // 替代 showSelectPlaylistModal
      showAlert: false,
      alertMessage: '',
      alertType: '',
      detailsType: '',
      showAddToPlaylistModal: false, // 控制模态框显示
      currentSongId: null, // 当前选择的歌曲ID
      searchType: 'music', // 添加搜索类型，初始为音乐
      searchQuery: '',     // 合并后的搜索查询
      songLyrics: '', // 添加用于存储歌词的属性
      searchResults: [], // 新增，用于存储搜索结果
      showSearchResultsModal: false, // 新增用于控制弹窗显示
    };
  },
  setup() {
    const playlistComponentRef = ref(null); // 定义 ref

    return {
      playlistComponentRef,
      // ...existing refs and reactive properties...
    };
  },
  computed: {
    userStore() {
      return useUserStore();
    },
    isLoggedIn() {
      return this.userStore.getIsLoggedIn;
    },
    displayedResults() {
      return this.searchType === 'music' ? this.musicList : this.mvList;
    },
  },
  methods: {
    goToLogin() {
      this.$router.push('/login');
    },
    goToPersonalInfo() {
      if (this.isLoggedIn) {
        this.$router.push('/personal-information');
      } else {
        this.showAlertMessage('请先登录', 'error');
        this.$router.push('/login');
      }
    },
    selectCategory(category) {
      this.selectedCategory = category;
      this.musicPage = 1; // 重置页码为1
      this.mvPage = 1;
      this.fetchMusicAndMV();
    },
    fetchCategories() {
      axios.get('/music/category').then(response => {
        console.log('Categories response:', response); // 
        if (response.data.code === 200) {
          this.categories = response.data.data; // 确保正确接收 data 数组
          console.log('Categories data:', this.categories); // 添加日志输出以检查接收到的分类数据
          if (this.categories.length > 0) {
            this.selectedCategory = this.categories[0]; // 默认选择第一个分类项
            this.fetchMusicAndMV();
          }
        } else {
          this.showAlertMessage('获取分类失败: ' + response.data.msg, 'error');
        }
      }).catch(error => {
        console.error('Fetch categories error:', error); // 添加详细的错误日志输出
        this.showAlertMessage('获取分类时发生错误', 'error');
      });
    },
    fetchMusicAndMV() {
      axios.get(`/music/page`, {
        params: {
          category: this.selectedCategory,
          page: this.musicPage,
          pageSize: this.itemsPerPage
        }
      }).then(response => {
        console.log('Music response:', response); // 添加日志输出以检查响应内容
        if (response.data.code === 200) { // 检查 code 项是否为 200
          const records = response.data.data.records; // 获取 records 数组
          if (Array.isArray(records)) { // 确保 records 是一个数组
            this.musicList = records.map(record => ({
              id: record.id,
              name: record.name,
              wording: record.wording,
              writeMusic: record.writeMusic,
              photo: record.photo,
              singer: record.singer,
              category: record.category // 确保包含 category 字段
            })); // 绑定音乐数据
            console.log('Fetched music:', this.musicList); // 添加日志输出以检查获取到的音乐数据
          } else {
            console.error('Expected records to be an array:', records);
            this.showAlertMessage('获取音乐数据格式错误', 'error');
          }
        } else {
          this.showAlertMessage('获取音乐失败: ' + response.data.msg, 'error');
        }
      }).catch(error => {
        console.error('Error fetching music:', error); // 添加详细的错误日志输出
        this.showAlertMessage('获取音乐时发生错误', 'error');
      });

      axios.get(`/mv/page`, {
        params: {
          category: this.selectedCategory,
          page: this.mvPage,
          pageSize: this.itemsPerPage
        }
      }).then(response => {
        console.log('MV response:', response);// 添加日志输出以检查响应内容
        if (response.data.code === 200) { // 检查 code 项是否为 200
          const records = response.data.data.records; // 获取 records 数组
          if (Array.isArray(records)) { // 确保 records 是一个数组
            this.mvList = records.map(record => ({
              id: record.id,
              name: record.name,
              describe: record.describe,
              author: record.author,
              photo: record.photo,
              category: record.category // 确保包含 category 字段
            })); // 绑定MV数据
            console.log('Fetched MVs:', this.mvList); // 添加日志输出以检查获取到的MV数据
          } else {
            console.error('Expected records to be an array:', records);
            this.showAlertMessage('获取MV数据格式错误', 'error');
          }
        } else {
          this.showAlertMessage('获取MV失败: ' + response.data.msg, 'error');
        }
      }).catch(error => {
        console.error('Error fetching MVs:', error); // 添加详细的错误日志输出
        this.showAlertMessage('获取MV时发生错误', 'error');
      });
    },
    prevMusic() {
      if (this.musicPage > 1) {
        this.musicPage--;
        this.fetchMusicAndMV();
      }
    },
    nextMusic() {
      this.musicPage++;
      this.fetchMusicAndMV();
    },
    prevMV() {
      if (this.mvPage > 1) {
        this.mvPage--;
        this.fetchMusicAndMV();
      }
    },
    nextMV() {
      this.mvPage++;
      this.fetchMusicAndMV();
    },
    showMusicDetails(id) {
      axios.get(`/music/${id}`).then(response => {
        this.details = response.data.data; 
        this.detailsType = 'music';
        // 获取歌词，使用正确的字段名 'lyric'
        this.songLyrics = response.data.data.lyric;
        this.showDetailsModal = true;
      }).catch(error => {
        console.error(error);
        alert('获取音乐详情时发生错误');
      });
    },
    showMVDetails(id) {
      axios.get(`/mv/${id}`).then(response => {
        this.details = response.data.data; 
        this.detailsType = 'mv';
        this.showDetailsModal = true;
      }).catch(error => {
        console.error(error);
        alert('获取MV详情时发生错误');
      });
    },
    closeDetailsModal() {
      this.showDetailsModal = false;
    },
    closePlaylistModal() {
      this.showPlaylistModal = false;
    },
    fetchPlaylists() {
      const userId = localStorage.getItem('userId');
      if (userId) {
        axios.get('/playlist/list', { params: { userId } }).then(response => {
          console.log('Fetch playlists response:', response); // 添加日志输出
          if (response.data.code === 200) {
            this.playlists = response.data.data;
          } else {
            this.showAlertMessage('获取歌单失败: ' + response.data.msg, 'error');
          }
        }).catch(error => {
          console.error('Error fetching playlists:', error); // 添加详细的错误日志输出
          this.showAlertMessage('获取歌单时发生错误', 'error');
        });
      }
    },
    addToPlaylist(playlistId) {
      if (this.currentSongId && playlistId) {
        const data = {
          playlistId: playlistId,
          musicId: this.currentSongId,
          userId: localStorage.getItem('userId') // 获取 userId
        };
        this.userStore.addToPlaylist(data)
          .then(() => {
            this.closeSelectPlaylistBox(); // 关闭选择歌单盒子
          })
          .catch((error) => {
            console.error('添加到歌单时发生错误:', error);
            alert('添加到歌单时发生错误');
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
          console.error(error);
          // this.showAlertMessage('获取用户信息时发生错误', 'error');
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
    openAddToPlaylistModal(musicId) {
      this.currentSongId = musicId;
      this.showSelectPlaylistBox = true; // 打开内嵌的选择歌单盒子
      this.userStore.fetchPlaylists(); // 使用 store 的 fetchPlaylists
    },
    closeSelectPlaylistBox() {
      this.showSelectPlaylistBox = false;
      this.currentSongId = null;
    },
    closeAddToPlaylistModal() {
      this.showAddToPlaylistModal = false;
      this.currentSongId = null;
    },
    handleDeleteSong(playlistId, musicId) {
      const userStore = useUserStore();
      userStore.deleteSongFromPlaylist({ playlistId, musicId })
        .then(() => {
          if (this.playlistComponentRef) {
            this.playlistComponentRef.fetchPlaylistSongs(playlistId); // 调用子组件的方法刷新歌曲列表
          }
        });
    },
    toggleSearchType() {
      this.searchType = this.searchType === 'music' ? 'mv' : 'music';
      this.searchQuery = ''; // 切换搜索类型时清空搜索框
    },
    handleSearch() {
      if (this.searchQuery.trim()) {
        const url = this.searchType === 'music' ? '/music/search' : '/mv/search';
        axios.get(url, { params: { name: this.searchQuery.trim() } })
          .then(response => {
            if (response.data.code === 200) {
              // 如果 data 是嵌套数组，取第一个数组的内容
              this.searchResults = Array.isArray(response.data.data[0]) ? response.data.data[0] : response.data.data;
              this.showSearchResultsModal = true;
            } else {
              this.showAlertMessage('搜索失败: ' + response.data.msg, 'error');
            }
          })
          .catch(error => {
            console.error('搜索时发生错误:', error);
            this.showAlertMessage('搜索时发生错误', 'error');
          });
      } else {
        this.showAlertMessage('请输入搜索内容', 'info');
      }
    },
    closeSearchResultsModal() {
      this.showSearchResultsModal = false; // 关闭搜索结果弹窗
    },
  },
  created() {
    try {
      const userStore = useUserStore();
      userStore.checkLoginStatus();
      console.log('HomeView created, isLoggedIn:', userStore.getIsLoggedIn);
      this.fetchCategories();
    } catch (error) {
      console.error('Error in created hook:', error);
    }
  },
  updated() {
    try {
      console.log('HomeView updated');
    } catch (error) {
      console.error('Error in updated hook:', error);
    }
  }
};
</script>

<style scoped>
.menu {
  display: flex;
  background-color: #f9f9f9;
  padding: 10px;
  border-bottom: 1px solid #ccc;
}
.menu a {
  margin-right: 20px;
  text-decoration: none;
  color: #333;
  padding: 10px;
  border-radius: 5px;
  transition: background-color 0.3s;
  cursor: pointer; /* 添加��行 */
  width: 120px; /* 扩大宽度 */
  text-align: center; /* 居中对齐 */
}
.menu a.active, .menu a:hover {
  background-color: #007bff;
  color: #fff;
}
.content {
  display: flex;
  padding: 20px;
  background-color: #f9f9f9;
}
.sidebar {
  width: 20%;
  padding: 20px;
  background-color: #fff;
  border-right: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 80vh; /* 修改为 100vh 以铺满整个窗口高度 */
  display: flex;
  flex-direction: column;
  height: 80%; /* 确保侧边栏占满父容器的高度 */
}
.sidebar h3 {
  margin-bottom: 10px;
  text-align: center;
}
.sidebar ul {
  flex: 1; /* 让列表占满剩余空间 */
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
}
.sidebar ul li {
  flex: 1; /* 每个列表项平分可用高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  margin: 5px 0;
  background-color: #f0f0f0;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.3s;
  font-size: 18px; /* 增大字体大小 */
}
.sidebar ul li:hover {
  background-color: #e0e0e0;
  transform: scale(1.02);
}
.sidebar ul li.selected {
  background-color: #007bff;
  color: #fff;
}
.main-content {
  width: 80%;
  padding: 20px;
  min-height: 80vh; /* 增大主内容区域最小高度 */
}
.music-section, .mv-section {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 70vh; /* 增大父元素最小高度 */
}
.music-list, .mv-list {
  display: flex;
  justify-content: space-between;
  width: 100%;
  min-height: 40vh; /* 设置默认高�� */
  overflow-y: auto; /* 添加垂直滚动条 */
}
.music-item, .mv-item {
  width: 30%;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  text-align: center;
  border: 1px solid #ccc; /* 添加边框 */
  height: 400px; /* 增加盒子高度 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden; /* 防止内容溢出 */
}
.music-photo, .mv-photo {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 5px;
  margin-bottom: 10px;
  transition: transform 0.3s ease;
}

.music-photo:hover, .mv-photo:hover {
  transform: scale(1.1);
}
.music-card, .mv-card {
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  height: 350px; /* 设置固定高度 */
  width: 80%; /* 设置宽度 */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.music-card h3, .mv-card h3 {
  margin: 10px 0;
  font-size: 18px;
  color: #333;
}
.music-card p, .mv-card p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}
.navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.navigation button {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 10px;
  border-radius: 50%; /* 改为圆形 */
  cursor: pointer;
  width: 40px; /* 固定宽度 */
  height: 40px; /* 固定高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px; /* 增大字体 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* 添加阴影 */
  transition: background-color 0.3s, transform 0.3s; /* 添加过渡效果 */
}
.navigation button:hover {
  background-color: #0056b3;
  transform: scale(1.1); /* 鼠标悬停时放大 */
}
.list-enter-active, .list-leave-active {
  transition: all 0.5s ease;
}
.list-enter, .list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.music-boxes {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}
.music-box {
  width: 30%;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  text-align: center;
  border: 1px solid #ccc; /* 添加边框 */
  height: 300px; /* 固定高度 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.music-card, .mv-card {
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 80%; /* 设置宽度 */
}
.music-card h3, .mv-card h3 {
  margin: 10px 0;
  font-size: 18px;
  color: #333;
}
.music-card p, .mv-card p {
  margin: 5px 0;
  font-size: 11.5px;
  color: #666;
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
  width: 100%;
  max-width: 300%;
  display: flex;
  flex-direction: row; /* 修改为水平布局 */
  height: auto;
}
.song-details {
  width: 100%; /* 增加歌曲详情区域的宽度 */
  padding-right: 20px;
}
.lyrics {
  flex: 5; /* 设置歌词区域占比 */
  padding-left: 20px;
  border-left: 1px solid #ccc;
  white-space: pre-wrap; /* 保持歌词的格式并允许换行 */
  overflow-y: auto; /* 添加垂直滚动 */
}
.song-details p, .lyrics p {
  white-space: pre-wrap; /* 确保歌词���常展示和换行 */
}
.modal-content img {
  width: 100%;
  height: auto;
  margin-bottom: 10px;
  border-radius: 5px;
}
.modal-content audio, .modal-content video {
  width: 100%;
  margin-top: 10px;
}
.modal-content h3 {
  margin-bottom: 10px;
  font-size: 24px;
  color: #333;
}
.modal-content p {
  margin: 5px 0;
  font-size: 16px;
  color: #666;
}
.modal-content .btn {
  margin-top: 20px;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.modal-content .btn.primary {
  background-color: #007bff;
  color: #fff;
}
.modal-content .btn.secondary {
  background-color: #6c757d;
  color: #fff;
}
.modal-content .btn:hover {
  opacity: 0.8;
}
.playlist-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.playlist-item {
  padding: 10px;
  margin: 10px 0;
  background-color: #f0f0f0;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: background-color 0.3s, transform 0.3s;
}
.playlist-item:hover {
  background-color: #e0e0e0;
  transform: scale(1.02);
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
.alert-box-enter-active, .alert-box-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}
.alert-box-enter, .alert-box-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.5s ease;
}
.slide-fade-enter, .slide-fade-leave-to {
  transform: translateX(30px);
  opacity: 0;
}
.sidebar ul {
  list-style-type: none;
  padding: 0;
}

.sidebar ul li {
  padding: 10px;
  margin: 5px 0;
  background-color: #f0f0f0;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.3s;
  font-size: 18px; /* 增大字体大小 */
}

.sidebar ul li:hover {
  background-color: #e0e0e0;
  transform: scale(1.02);}.sidebar ul li.selected {  background-color: #007bff;  color: #fff;}
.modal-body {
  display: flex;
  width:100%;
}
.details-left {
  flex: 2;
  padding-right: 20px;
}
.lyrics {
  flex: 3; /* 将 flex 值从 2 增加到 3，扩大宽度 */
  padding-left: 20px;
  border-left: 1px solid #ccc;
  overflow-y: auto;
  max-height: 400px; /* 根据需要调整高度 */
}
.add-playlist-btn {
  display: none; /* 隐藏按钮 */
}

/* 新增选择歌单盒子样式 */
.select-playlist-box {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.select-playlist-box .modal-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  width: 400px;
  text-align: center;
}

.playlist-list {
  list-style: none;
  padding: 0;
  margin: 20px 0;
}

.playlist-item {
  padding: 10px;
  margin: 10px 0;
  background-color: #f0f0f0;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.playlist-item:hover {
  background-color: #e0e0e0;
}

.btn.secondary {
  background-color: #6c757d;
  color: #fff;
}

.btn.secondary:hover {
  background-color: #5a6268;
}

/* 美化搜索表单 */
.search-form {
  display: flex;
  align-items: center;
  margin-left: 20px;
}

.search-form input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.3s;
  font-size: 14px;
}

.search-form input:focus {
  border-color: #007bff;
}

.search-form button {
  padding: 8px 16px;
  margin-left: 8px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
}

.search-form button:hover {
  background-color: #0056b3;
}

/* 可选：调整其他相关样式 */
.music-list {
  /* ...existing code... */
  display: flex;
  justify-content: space-between;
}

.music-item {
  /* ...existing code... */
  width: 30%; /* 确保所有音乐项宽度一致 */
}

.music-item:first-child {
  width: 30%; /* 设置第一个音乐项宽度与其他一致 */
}
.search-container {
  display: flex;
  align-items: center;
  margin-left: 20px;
}

.toggle-search-btn {
  padding: 8px 12px;
  margin-right: 8px;
  background-color: #1d5682;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
}

.toggle-search-btn:hover {
  background-color: #5a5a68;
}

.search-form {
  display: flex;
  align-items: center;
}

.modal-content {
  max-width: 600px;
}

.modal-content h2 {
  margin-bottom: 20px;
}

.modal-content ul {
  list-style: none;
  padding: 0;
}

.modal-content li {
  padding: 10px;
  border-bottom: 1px solid #ccc;
}

.modal-content li:last-child {
  border-bottom: none;
}
</style>