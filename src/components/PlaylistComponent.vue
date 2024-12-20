<template>
  <div>
    <h2>我的歌单</h2>
    <ul class="playlist-list">
      <li v-for="playlist in playlists" :key="playlist.id" class="playlist-item">
        {{ playlist.name }}
        <button @click="deletePlaylist(playlist.id)" class="delete-btn">删除</button>
        <button @click="fetchPlaylistSongs(playlist.id)" class="view-btn">查看歌曲</button>
      </li>
    </ul>
    
    <!-- 模态框 -->
    <div v-if="isModalVisible" class="modal">
      <div class="modal-content">
        <h3>{{ selectedPlaylist.name }} - 歌曲列表</h3>
        <ul class="songs-list">
          <li v-for="song in selectedPlaylistSongs" :key="song.id" class="song-item">
            <div class="song-info">
              <img :src="song.photo" alt="song photo" class="song-photo" />
              <div class="song-details">
                <h4>{{ song.name }}</h4>
                <p>作曲: {{ song.writeMusic }}</p>
                <p>歌手: {{ song.artist }}</p>
                <p>描述: {{ song.wording }}</p>
              </div>
              <button @click="playSong(song.audio)" class="play-btn">播放</button>
              <button @click="$emit('deleteSong', selectedPlaylist.id, song.id)" class="delete-btn">删除</button>
            </div>
          </li>
        </ul>
        <button @click="closeModal" class="btn secondary">关闭</button>
        <audio ref="audioPlayer" controls style="display: none;"></audio>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useUserStore } from '@/store';

export default {
  name: 'PlaylistComponent',
  props: {
    playlists: {
      type: Array,
      required: true
    },
    currentSongId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      selectedPlaylistSongs: [],
      isModalVisible: false, // 控制模态框显示
      selectedPlaylist: {} // 当前选中的歌单
    };
  },
  created() {
    const userStore = useUserStore();
    if (!userStore.getIsLoggedIn) {
      alert('请先登录以查看歌单');
    }
  },
  methods: {
    fetchPlaylistSongs(playlistId) { // 现有方法，无需更改
      const userStore = useUserStore();
      const userId = userStore.getUser.id;
      if (userId) {
        const params = {
          listId: playlistId,
          userId: userId
        };
        axios.get('/playlist/music', { params })
          .then(response => {
            console.log('Fetch playlist songs response:', response);
            if (response.data.code === 200) {
              this.selectedPlaylistSongs = response.data.data.map(song => ({
                id: song.id,
                name: song.name,
                artist: song.singer,
                wording: song.wording,
                writeMusic: song.writeMusic,
                photo: song.photo,
                audio: song.audio
              }));
              // 设置当前选中的歌单
              this.selectedPlaylist = this.playlists.find(pl => pl.id === playlistId);
              this.isModalVisible = true; // 显示模态框
            } else {
              alert('获取歌单歌曲失败: ' + response.data.msg);
            }
          })
          .catch(error => {
            console.error('Error fetching playlist songs:', error);
            alert('获取歌单歌曲时发生错误');
          });
      } else {
        alert('请先登录以查看歌单歌曲');
      }
    },
    playSong(audioUrl) {
      const audioPlayer = this.$refs.audioPlayer;
      audioPlayer.src = audioUrl;
      audioPlayer.style.display = 'block';
      audioPlayer.play();
    },
    deletePlaylist(playlistId) {
      const userStore = useUserStore();
      const userId = userStore.getUser.id;
      if (userId) {
        axios.delete('/playlist', {
          data: {
            id: playlistId,
            userId: userId
          }
        }).then(response => {
          if (response.data.code === 200) {
            this.$emit('refreshPlaylists');
            alert('删除歌单成功');
          } else {
            alert('删除歌单失败: ' + response.data.msg);
          }
        }).catch(error => {
          console.error('删除歌单错误:', error);
          alert('删除歌单时发生错误');
        });
      } else {
        alert('请先登录');
      }
    },
    closeModal() {
      this.isModalVisible = false;
      this.selectedPlaylistSongs = [];
      this.selectedPlaylist = {};
    }
  }
};
</script>

<style scoped>
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
  transition: background-color 0.3s, transform 0.3s;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.playlist-item:hover {
  background-color: #e0e0e0;
  transform: scale(1.02);
}

.delete-btn, .view-btn, .play-btn {
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.delete-btn {
  background-color: #ff4d4d;
  color: #fff;
}

.delete-btn:hover {
  background-color: #ff1a1a;
}

.view-btn {
  background-color: #007bff;
  color: #fff;
  margin-left: 5px;
}

.view-btn:hover {
  background-color: #0056b3;
}

.play-btn {
  background-color: #28a745;
  color: #fff;
  margin-left: 5px;
}

.play-btn:hover {
  background-color: #218838;
}

/* 添加歌曲图片放大效果 */
.song-photo {
  transition: transform 0.3s ease;
}

.song-photo:hover {
  transform: scale(1.1);
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
  width: 80%; /* 增大模态框宽度 */
  max-width: 1000px; /* 设置更大的最大宽度 */
  max-height: 80vh; /* 设置最大高度 */
  overflow-y: auto; /* 添加垂直滚动 */
}

.songs-list {
  list-style: none;
  padding: 0;
  margin: 20px 0;
}

.song-item {
  padding: 10px;
  margin: 10px 0;
  background-color: #f0f0f0;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.song-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.song-photo {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 5px;
  margin-right: 10px;
}

.song-details {
  display: flex;
  flex-direction: column;
  width: 100%; /* 增加歌曲详情区域的宽度 */
  word-wrap: break-word; /* 确保文本换行 */
}

.song-details h4 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.song-details p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
  white-space: pre-wrap; /* 保持歌词的格式并允许换行 */
}

.btn.secondary {
  background-color: #6c757d;
  color: #fff;
}

.btn.secondary:hover {
  background-color: #5a6268;
}

/* 新增歌词样式 */
.lyrics {
  width: 80%; /* 设置歌词区域宽度 */
  padding-left: 20px;
  border-left: 1px solid #ccc;
  white-space: pre-wrap; /* 保持歌词的格式并允许换行 */
  overflow-y: auto; /* 添加垂直滚动 */
}
</style>
