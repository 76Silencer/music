<script setup>
import { ref, computed } from 'vue';
import { useAudioPlayer } from '../composables/useAudioPlayer';

const { librarySongs, addToPlaylist, addLocalFolder } = useAudioPlayer();
const searchQuery = ref('');

const filteredSongs = computed(() => {
  const query = searchQuery.value.toLowerCase();
  if (!query) return librarySongs.value;
  return librarySongs.value.filter(song => 
    song.title.toLowerCase().includes(query) || 
    song.artist.toLowerCase().includes(query)
  );
});
</script>

<template>
  <div class="library">
    <div class="library-header">
      <div class="header-top">
        <h2>曲库</h2>
        <button class="add-folder-btn" @click="addLocalFolder" title="选择本地音乐文件夹">📂 添加本地目录</button>
      </div>
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="搜索歌曲或歌手..." 
        class="search-input"
      />
    </div>
    
    <div class="song-list">
      <div 
        v-for="song in filteredSongs" 
        :key="song.id"
        class="song-item"
        @click="addToPlaylist(song)"
      >
        <img :src="song.cover" alt="cover" class="cover-img" />
        <div class="song-info">
          <div class="title">{{ song.title }}</div>
          <div class="artist">{{ song.artist }}</div>
        </div>
        <button class="add-btn" title="添加到播放列表">＋</button>
      </div>
      <div v-if="filteredSongs.length === 0" class="empty-state">
        没有找到匹配的歌曲
      </div>
    </div>
  </div>
</template>

<style scoped>
.library {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.library-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h2 {
  font-size: 18px;
  margin: 0;
  color: #3b82f6;
  font-weight: 600;
}

.add-folder-btn {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #3b82f6;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.add-folder-btn:hover {
  background: rgba(59, 130, 246, 0.3);
  color: #fff;
}

.search-input {
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
}

.song-list {
  overflow-y: auto;
  flex: 1;
}

.song-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-bottom: 6px;
}

.song-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.cover-img {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  margin-right: 12px;
}

.song-info {
  flex: 1;
  overflow: hidden;
}

.title {
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist {
  font-size: 13px;
  color: #b3b3b3;
}

.add-btn {
  background: transparent;
  border: none;
  color: #b3b3b3;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
}

.song-item:hover .add-btn {
  opacity: 1;
  color: #3b82f6;
}

.empty-state {
  text-align: center;
  color: #b3b3b3;
  padding: 20px 0;
  font-size: 14px;
}

.song-list::-webkit-scrollbar {
  width: 6px;
}
.song-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
</style>
