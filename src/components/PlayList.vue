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

// 移动端 Touch 拖拽排序逻辑
const onTouchStart = (song, event) => {
  draggedIndex.value = playlist.value.findIndex(s => s.id === song.id);
  // 防止页面滚动
  document.body.style.overflow = 'hidden';
};

const onTouchMove = (event) => {
  if (draggedIndex.value === null) return;
  
  const touch = event.touches[0];
  // 找到手指当前位置的元素
  const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
  const targetItem = targetElement?.closest('.playlist-item');
  
  if (targetItem) {
    const dropSongId = targetItem.getAttribute('data-id');
    // 注意类型转换，如果 id 是数字的话
    const dropIndex = playlist.value.findIndex(s => String(s.id) === dropSongId);
    
    if (dropIndex !== -1 && dropIndex !== draggedIndex.value) {
      // 实时移动元素位置
      moveSong(draggedIndex.value, dropIndex);
      draggedIndex.value = dropIndex;
    }
  }
};

const onTouchEnd = () => {
  draggedIndex.value = null;
  document.body.style.overflow = '';
};

// 提取前 4 首歌的封面用于生成九宫格/四宫格
const collageCovers = computed(() => {
  return playlist.value.slice(0, 4).map(song => song.cover);
});
</script>

<template>
  <div class="playlist">
    <div class="playlist-header">
      <h2>播放列表</h2>
    </div>
    
    <div class="playlist-cover-wrapper" v-if="playlist.length > 0">
      <div class="collage-grid" :class="'count-' + Math.min(4, playlist.length)">
        <img v-for="(cover, i) in collageCovers" :key="i" :src="cover" alt="cover collage" />
      </div>
      <div class="cover-info">
        <h3>我的专属歌单</h3>
        <p>共 {{ playlist.length }} 首歌曲</p>
      </div>
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
        :class="{ active: currentSong?.id === song.id, 'is-dragging': draggedIndex === playlist.indexOf(song) }"
        :data-id="song.id"
        draggable="true"
        @dragstart="onDragStart(song)"
        @dragover.prevent
        @drop="onDrop(song)"
        @click="playSongById(song.id)"
      >
        <div 
          class="drag-handle" 
          title="拖动排序"
          @touchstart="onTouchStart(song, $event)"
          @touchmove.prevent="onTouchMove"
          @touchend="onTouchEnd"
        >⋮⋮</div>
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
  min-height: 0;
}

@media (max-width: 768px) {
  .playlist {
    padding: 15px;
  }
  
  .playlist-cover-wrapper {
    padding-bottom: 12px;
    margin-bottom: 12px;
    gap: 12px;
  }
  
  .collage-grid {
    width: 55px;
    height: 55px;
    border-radius: 8px;
  }
  
  .cover-info h3 {
    font-size: 15px;
    margin-bottom: 4px;
  }
  
  .cover-info p {
    font-size: 12px;
  }
  
  .remove-btn {
    opacity: 1; /* 手机端取消 hover，永远显示删除按钮 */
    font-size: 16px;
    padding: 10px;
  }
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

.playlist-cover-wrapper {
  display: flex;
  align-items: center;
  padding-bottom: 20px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  gap: 16px;
}

.collage-grid {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  display: grid;
  gap: 2px;
  background: rgba(255,255,255,0.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  flex-shrink: 0;
}

/* 1张图时占满 */
.collage-grid.count-1 {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

/* 2张图时左右各半 */
.collage-grid.count-2 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
}

/* 3张图时，左侧一张大的，右侧上下两张小的 */
.collage-grid.count-3 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}
.collage-grid.count-3 img:nth-child(1) {
  grid-area: 1 / 1 / 3 / 2; /* 占据左侧两行 */
}
.collage-grid.count-3 img:nth-child(2) {
  grid-area: 1 / 2 / 2 / 3; /* 占据右上方 */
}
.collage-grid.count-3 img:nth-child(3) {
  grid-area: 2 / 2 / 3 / 3; /* 占据右下方 */
}

/* 4张图时完美四宫格 */
.collage-grid.count-4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.collage-grid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-info {
  flex: 1;
  overflow: hidden;
}

.cover-info h3 {
  font-size: 16px;
  margin: 0 0 6px 0;
  color: #fff;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cover-info p {
  margin: 0;
  font-size: 13px;
  color: #3b82f6;
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

.playlist-item.is-dragging {
  opacity: 0.5;
  background: rgba(255, 255, 255, 0.2);
  transform: scale(0.98);
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
