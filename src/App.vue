<script setup>
import { ref } from 'vue';
import Library from './components/SongLibrary.vue';
import PlayList from './components/PlayList.vue';
import PlayerControls from './components/PlayerControls.vue';
import SongDetail from './components/SongDetail.vue';
import { useAudioPlayer } from './composables/useAudioPlayer';

const { currentSong } = useAudioPlayer();
const showDetail = ref(false);
const activeTab = ref('library'); // 'library' or 'playlist'

const openDetail = () => {
  if (currentSong.value) {
    showDetail.value = true;
  }
};
</script>

<template>
  <div class="app-container">
    <div class="main-layout">
      <!-- Top Section -->
      <div class="content-section">
        <div class="mobile-tabs" v-show="!showDetail">
          <button :class="{ active: activeTab === 'library' }" @click="activeTab = 'library'">曲库</button>
          <button :class="{ active: activeTab === 'playlist' }" @click="activeTab = 'playlist'">播放列表</button>
        </div>
        <Library class="tab-content" :class="{ 'active-tab': activeTab === 'library' }" v-show="!showDetail" />
        <PlayList class="tab-content" :class="{ 'active-tab': activeTab === 'playlist' }" v-show="!showDetail" />
        
        <SongDetail v-if="showDetail" @close="showDetail = false" />
      </div>
      
      <!-- Bottom Section: Player Controls -->
      <div class="player-section">
        <div class="now-playing-info" @click="openDetail" :class="{ 'clickable': currentSong && !showDetail }">
          <template v-if="currentSong">
            <div class="cover-container">
              <img :src="currentSong.cover" class="now-playing-cover" alt="cover" />
              <div class="expand-icon" v-if="!showDetail">⤢</div>
            </div>
            <div class="np-text">
              <div class="np-title">{{ currentSong.title }}</div>
              <div class="np-artist">{{ currentSong.artist }}</div>
            </div>
          </template>
        </div>
        
        <PlayerControls class="flex-controls" />
        
        <div class="spacer"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #020617 100%); /* Blue tinted dark background */
  padding: 20px;
}

.main-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1000px; /* Wider for desktop split view */
  height: 85vh; /* Fixed height so inner content scrolls */
  background: rgba(20, 20, 25, 0.7);
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.content-section {
  display: flex;
  flex: 1;
  gap: 20px;
  padding: 30px;
  overflow: hidden; /* Let children handle scrolling */
  position: relative; /* For SongDetail overlay */
}

.mobile-tabs {
  display: none;
}

.player-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  height: 100px;
  background: rgba(0, 0, 0, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  z-index: 20; /* Keep above SongDetail */
}

.now-playing-info {
  display: flex;
  align-items: center;
  width: 250px; /* Fixed width for left area */
  transition: transform 0.2s;
}

.now-playing-info.clickable {
  cursor: pointer;
}

.now-playing-info.clickable:hover {
  transform: scale(1.02);
}

.cover-container {
  position: relative;
  width: 60px;
  height: 60px;
  margin-right: 15px;
}

.now-playing-cover {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.expand-icon {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 24px;
  opacity: 0;
  transition: opacity 0.2s;
}

.now-playing-info.clickable:hover .expand-icon {
  opacity: 1;
}

.np-text {
  overflow: hidden;
}

.np-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.np-artist {
  font-size: 14px;
  color: #b3b3b3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.flex-controls {
  flex: 1;
  max-width: 500px;
}

.spacer {
  width: 250px; /* Balance the now-playing-info width */
}

/* Responsiveness */
@media (max-width: 768px) {
  .app-container {
    padding: 0;
  }
  .main-layout {
    height: 100vh;
    height: 100dvh; /* 支持移动端浏览器的真实高度 */
    border-radius: 0;
    border: none;
  }
  .content-section {
    flex-direction: column;
    padding: 15px;
    gap: 15px;
    /* 防止移动端软键盘/地址栏收放导致高度变化，限制最大高度 */
    max-height: calc(100vh - 120px); 
  }
  
  .mobile-tabs {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
  }
  
  .mobile-tabs button {
    flex: 1;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #b3b3b3;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .mobile-tabs button.active {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    border-color: rgba(59, 130, 246, 0.5);
  }
  
  /* 在手机端隐藏非活跃的 tab */
  .content-section > .tab-content {
    display: none !important;
  }
  .content-section > .tab-content.active-tab {
    display: flex !important;
  }

  .player-section {
    padding: 10px 15px;
    height: auto;
    flex-direction: column;
    gap: 10px;
  }
  .now-playing-info, .spacer {
    width: 100%;
    justify-content: flex-start;
  }
  .flex-controls {
    width: 100%;
    max-width: 100%;
  }
  .spacer {
    display: none;
  }
}
</style>
