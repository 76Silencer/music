<script setup>
import { ref, computed } from 'vue';
import { useAudioPlayer } from '../composables/useAudioPlayer';

const { playlist, currentSong, playSongById, isPlaying, removeFromPlaylist, moveSong } = useAudioPlayer();

const searchQuery = ref('');

const filteredPlaylist = computed(() => {
  const query = searchQuery.value.toLowerCase();
  if (!query) return playlist.value;
  return playlist.value.filter(song => 
    song.title.toLowerCase().includes(query) || 
    song.artist.toLowerCase().includes(query)
  );
});

// Drag and drop logic
const draggedIndex = ref(null);

const onDragStart = (song) => {
  draggedIndex.value = playlist.value.findIndex(s => s.id === song.id);
};

const onDrop = (song) => {
  const dropIndex = playlist.value.findIndex(s => s.id === song.id);
  if (draggedIndex.value !== null && draggedIndex.value !== dropIndex) {
    moveSong(draggedIndex.value, dropIndex);
  }
  draggedIndex.value = null;
};
</script>

<template>
  <div class="playlist">
    <div class="playlist-header">
      <h2>播放列表</h2>
      <span class="count">{{ playlist.length }} 首歌曲</span>
    </div>
    
    <div class="search-box">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="在列表中搜索..." 
        class="search-input"
      />
    </div>
    
    <div class="song-list" v-if="filteredPlaylist.length > 0">
      <div 
        v-for="song in filteredPlaylist" 
        :key="song.id"
        class="playlist-item"
        :class="{ active: currentSong?.id === song.id }"
        draggable="true"
        @dragstart="onDragStart(song)"
        @dragover.prevent
        @drop="onDrop(song)"
        @click="playSongById(song.id)"
      >
        <div class="drag-handle" title="拖动排序">⋮⋮</div>
        <img :src="song.cover" alt="cover" class="cover-img" />
        <div class="song-info">
          <div class="title">{{ song.title }}</div>
          <div class="artist">{{ song.artist }}</div>
        </div>
        <div class="status-icon" v-if="currentSong?.id === song.id">
          <span v-if="isPlaying">🎵</span>
          <span v-else>⏸</span>
        </div>
        <button class="remove-btn" @click.stop="removeFromPlaylist(song.id)" title="移除">✕</button>
      </div>
    </div>
    <div v-else class="empty-state">
      {{ playlist.length === 0 ? '列表是空的，快去曲库添加歌曲吧' : '没有找到匹配的歌曲' }}
    </div>
  </div>
</template>

<style scoped>
.playlist {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

h2 {
  font-size: 18px;
  margin: 0;
  color: #fff;
}

.count {
  font-size: 13px;
  color: #b3b3b3;
}

.search-box {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.search-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #3b82f6;
}

.song-list {
  overflow-y: auto;
  flex: 1;
}

.playlist-item {
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
  position: relative;
}

.playlist-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.playlist-item.active {
  background: rgba(59, 130, 246, 0.15);
  border-left: 4px solid #3b82f6;
}

.drag-handle {
  color: #666;
  font-size: 16px;
  padding: 0 10px 0 2px;
  cursor: grab;
  user-select: none;
}

.drag-handle:active {
  cursor: grabbing;
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

.status-icon {
  font-size: 16px;
  margin-right: 10px;
}

.remove-btn {
  background: transparent;
  border: none;
  color: #b3b3b3;
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  padding: 4px;
  transition: all 0.2s;
}

.playlist-item:hover .remove-btn {
  opacity: 1;
}
.remove-btn:hover {
  color: #ff4d4f;
}

.empty-state {
  text-align: center;
  color: #b3b3b3;
  padding: 30px 0;
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
