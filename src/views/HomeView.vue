<template>
  <div>
    <nav class="menu">
      <a :class="{ active: activeIndex === '1' }" @click="activeIndex = '1'">首页</a>
      <a v-if="isLoggedIn" :class="{ active: activeIndex === '2' }" @click="goToPersonalInfo">我的</a>
      <a v-if="!isLoggedIn" :class="{ active: activeIndex === '3' }" @click="goToLogin">登录</a>
      
      <!-- 搜索框和切换按钮 -->
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
        <transition name="fade" mode="out-in">
          <div v-if="searchType === 'music'" key="music" class="music-section">
            <h3>音乐</h3>
            <div class="navigation">
              <button @click="prevMusic">←</button>
              <div class="music-list">
                <div v-for="music in displayedResults" :key="music.id" class="music-item" @click="showMusicDetails(music.id)">
                  <div class="music-card">
                    <img :src="music.photo" alt="music photo" class="music-photo" />
                    <h3>{{ music.name }}</h3>
                    <p>作曲: {{ music.writeMusic }}</p>
                    <p>歌手: {{ music.singer }}</p>
                  </div>
                </div>
              </div>
              <button @click="nextMusic">→</button>
            </div>
          </div>
          <div v-else key="mv" class="mv-section">
            <h2>MV</h2>
            <div class="navigation">
              <button @click="prevMV">←</button>
              <div class="mv-list">
                <div v-for="mv in displayedResults" :key="mv.id" class="mv-item" @click="showMVDetails(mv.id)">
                  <div class="mv-card">
                    <img :src="mv.photo" alt="mv photo" class="mv-photo" />
                    <h3>{{ mv.name }}</h3>
                    <p>作者: {{ mv.author }}</p>
                  </div>
                </div>
              </div>
              <button @click="nextMV">→</button>
            </div>
          </div>
        </transition>
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
              <img v-if="detailsType === 'music'" :src="details.photo" alt="photo" class="music-photo" />
              <audio v-if="detailsType === 'music'" :src="details.audio" controls></audio>
              <video v-if="detailsType === 'mv'" :src="details.video" controls></video>
              <div class="button-group">
                <button class="btn primary" @click="closeDetailsModal">关闭</button>
                <button v-if="detailsType === 'music'" :class="['btn', 'secondary', { disabled: !isLoggedIn }]" @click="isLoggedIn ? openAddToPlaylistModal(details.id) : showAlertMessage('请先登录', 'error')">加入歌单</button>
              </div>
            </div>
            <div v-if="detailsType === 'music'" class="lyrics">
              <h3>歌词</h3>
              <p>{{ songLyrics }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showPlaylistModal" class="modal">
      <div class="modal-content">
        <div>
          <PlaylistComponent 
            :playlists="playlists" 
            :currentSongId="currentSongId" 
            @refreshPlaylists="fetchPlaylists" 
            @closeModal="showPlaylistModal = false"
          />
        </div>
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
    <!-- 内嵌的选择歌单盒子 -->
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
        <button @click="closeSelectPlaylistBox" class="btn secondary close-btn">关闭</button>
      </div>
    </div>

    <!-- 搜索结果弹窗 -->
    <div v-if="showSearchResultsModal" class="modal">
      <div class="modal-content">
        <h2>搜索结果</h2>
        <div v-if="searchResults.length > 0" class="search-box">
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
        <div v-else class="search-box">
          <p>没有找到相关结果。</p>
        </div>
        <div class="button-container">
          <button @click="closeSearchResultsModal" class="btn secondary">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '@/store';
import axios from 'axios';
import PlaylistComponent from '@/components/PlaylistComponent.vue';
import { ref } from 'vue';

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
      itemsPerPage: 3, // 每页显示3个
      showDetailsModal: false,
      details: {},
      showPlaylistModal: false, // 现有模态框
      showSelectPlaylistBox: false, // 选择歌单盒子显示
      showAlert: false,
      alertMessage: '',
      alertType: '',
      detailsType: '',
      showAddToPlaylistModal: false, // 控制模态框显示
      currentSongId: null, // 当前选择的歌曲ID
      searchType: 'music', // 添加搜索类型，初始为音乐
      searchQuery: '',     // 合并后的搜索查询
      songLyrics: '', // 添加用于存储歌词的属性
      searchResults: [], // 用于存储搜索结果
      showSearchResultsModal: false, // 用于控制弹窗显示
    };
  },
  setup() {
    const playlistComponentRef = ref(null);

    return {
      playlistComponentRef,
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
      this.musicPage = 1; // 重置页码
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
          if (Array.isArray(records)) {
            this.musicList = records.map(record => ({
              id: record.id,
              name: record.name,
              wording: record.wording,
              writeMusic: record.writeMusic,
              photo: record.photo,
              singer: record.singer,
              category: record.category // 包含 category 字段
            })); // 绑定音乐数据
            console.log('Fetched music:', this.musicList); // 日志输出
          } else {
            console.error('Expected records to be an array:', records);
            this.showAlertMessage('获取音乐数据格式错误', 'error');
          }
        } else {
          this.showAlertMessage('获取音乐失败: ' + response.data.msg, 'error');
        }
      }).catch(error => {
        console.error('Error fetching music:', error); // 错误日志输出
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
              category: record.category // 包含 category 字段
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
  cursor: pointer; /* 添加指针触碰效果 */
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
  min-height: 80vh;
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
  margin-left: 20px;
  width: 80%;
  padding: 0px;
  min-height: 80vh; /* 增大主内容区域最小高度 */
  display: flex;
  flex-direction: column; /* 确保子元素垂直排列 */
}

.music-section, .mv-section {
  margin-bottom: 0px;
  padding: 20px;
  height: 100%; /* 设置高度为 100% */
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex: 1; /* 确保 music-section 和 mv-section 占满父元素的剩余高度 */
  overflow-y: auto; /* 添加垂直滚动条 */
}
.music-list, .mv-list {
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 90%; /* 设置高度 */
  min-height: 40vh; /* 设置默认高度 */
  overflow-y: auto; /* 添加垂直滚动条 */
}
.music-item, .mv-item {
  width: 30%;
  height: 95%;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  text-align: center;
  border: 1px solid #ccc; /* 添加边框 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.music-photo, .mv-photo {
  width: 100%;
  height: 300px;
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
  height: 90%;
  width: 80%; /* 设置宽高 */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.music-card h3, .mv-card h3 {
  margin: 10px 0;
  font-size: 22px;
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
  height: 90%;
  flex-grow: 1; /* 确保 navigation 占据父元素的剩余高度 */
}
.navigation button {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 10px;
  border-radius: 50%; /* 改为圆形 */
  cursor: pointer;
  width: 40px;
  height: 40px; /* 固定宽高 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px; /* 增大字体 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* 添加阴影 */
  transition: background-color 0.3s, transform 0.3s;
}
.navigation button:hover {
  background-color: #0056b3;
  transform: scale(1.1); /* 悬停放大 */
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
  border: 1px solid #ccc; /* 边框 */
  height: 300px;
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
  width: 80%;
}
.music-card h3, .mv-card h3 {
  margin: 10px 0;
  font-size: 22px;
  color: #333;
}
.music-card p, .mv-card p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: auto;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
}
.modal-content {
  background-color: #fff;
  padding: 10px;
  border-radius: 10px;
  text-align: center;
  width: 200%;
  display: flex;
  flex-direction: row;
  height: auto;
}
.song-details {
  width: 200%;
  padding: 0px;
}
.song-details p, .lyrics p {
  white-space: pre-wrap; /* 确保歌词正常展示和换行 */
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
  width: 100px;
  height: 40px;
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
  width:50%;
  padding: 30px 0px 0px 0px;
  margin:10px 0px 0px 10px;
  height: calc(100% - 60px); /* 确保列表占满剩余空间 */
  overflow-y: auto; /* 添加垂直滚动条 */
}

.playlist-list::-webkit-scrollbar {
  display: none; /* 隐藏滚动条 (WebKit) */
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
  transition: opacity 1s, transform 1s;
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
  padding-right: 10px;
}
.lyrics {
  flex: 3;
  padding-left: 10px;
  border-left: 1px solid #ccc;
  overflow-y: auto;
  max-height: 500px; /* 根据需要调整高度 */
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
  height: 300px;
  text-align: center;
  position: relative; /* 确保关闭按钮相对于父元素定位 */
}
.playlist-list {
  list-style: none;
  padding: 0;
  margin: 20px 0;
  height: calc(100% - 60px); /* 确保列表占满剩余空间 */
  overflow-y: auto; /* 添加垂直滚动条 */
}

.close-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
}

.btn.secondary {
  background-color: #6c757d;
  color: #fff;
}

.btn.secondary:hover {
  background-color: #5a6268;
}

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

.music-list {
  display: flex;
  justify-content: space-between;
}

.music-item {
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
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
  display: block;
}
.close-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  margin: 0;
}
.button-container {
  display: flex;
  justify-content: flex-end;
  align-self: flex-end;
  margin-bottom: 20px;
  height: 50px; /* 设置固定高度 */
}
.btn.disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.search-box {
  padding: 20px;
  width: 50%;
  height: 300px; /* 设置默认高度 */
  overflow-y: auto; /* 添加垂直滚动条 */
}
button {
  width: 100px;
  height: 40px;
}
.button-group {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.btn {
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 120px;
  height: 40px;
}

.btn.primary {
  background-color: #007bff;
  color: #fff;
}

.btn.secondary {
  background-color: #6c757d;
  color: #fff;
}

.btn:hover {
  opacity: 0.8;
}

.btn.disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>