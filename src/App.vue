<script setup>
import { ref } from 'vue';
import Library from './components/SongLibrary.vue';
import PlayList from './components/PlayList.vue';
import PlayerControls from './components/PlayerControls.vue';
import SongDetail from './components/SongDetail.vue';
import { useAudioPlayer } from './composables/useAudioPlayer';

const { currentSong } = useAudioPlayer();
const showDetail = ref(false);

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
        <Library v-show="!showDetail" />
        <PlayList v-show="!showDetail" />
        
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
  .content-section {
    flex-direction: column;
    overflow-y: auto;
  }
  .player-section {
    padding: 15px;
    height: auto;
    flex-direction: column;
    gap: 15px;
  }
  .now-playing-info, .spacer {
    width: 100%;
    justify-content: center;
  }
  .spacer {
    display: none;
  }
}
</style>
