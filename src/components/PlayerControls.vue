<script setup>
import { computed } from 'vue';
import { useAudioPlayer } from '../composables/useAudioPlayer';

const {
  isPlaying,
  currentTime,
  duration,
  volume,
  playMode,
  togglePlay,
  next,
  prev,
  seek,
  setVolume,
  setPlayMode
} = useAudioPlayer();

const formatTime = (time) => {
  if (!time || isNaN(time)) return '0:00';
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const handleSeek = (e) => {
  seek(Number(e.target.value));
};

const handleVolume = (e) => {
  setVolume(Number(e.target.value));
};

const toggleMode = () => {
  const modes = ['sequence', 'loop', 'random'];
  const nextIndex = (modes.indexOf(playMode.value) + 1) % modes.length;
  setPlayMode(modes[nextIndex]);
};

const modeLabel = computed(() => {
  const map = {
    sequence: '🔁 列表',
    loop: '🔂 单曲',
    random: '🔀 随机'
  };
  return map[playMode.value];
});
</script>

<template>
  <div class="player-controls">
    <!-- Progress Bar -->
    <div class="progress-container">
      <span class="time">{{ formatTime(currentTime) }}</span>
      <input 
        type="range" 
        class="progress-bar" 
        :value="currentTime" 
        :max="duration" 
        @input="handleSeek"
      />
      <span class="time">{{ formatTime(duration) }}</span>
    </div>

    <!-- Controls -->
    <div class="controls-row">
      <button class="mode-btn" @click="toggleMode">{{ modeLabel }}</button>
      
      <div class="main-controls">
        <button class="icon-btn" @click="prev">⏮</button>
        <button class="play-btn" @click="togglePlay">
          {{ isPlaying ? '⏸' : '▶️' }}
        </button>
        <button class="icon-btn" @click="next">⏭</button>
      </div>

      <!-- Volume -->
      <div class="volume-container">
        <span>🔉</span>
        <input 
          type="range" 
          class="volume-bar" 
          :value="volume" 
          min="0" 
          max="1" 
          step="0.01" 
          @input="handleVolume"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-controls {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.time {
  font-size: 12px;
  color: #b3b3b3;
  width: 35px;
  text-align: center;
}

.progress-bar {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  background: #4d4d4d;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  transition: background 0.2s;
}

.progress-bar:hover {
  background: #666;
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  transition: transform 0.1s;
}

.progress-bar::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.main-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

button {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  transition: transform 0.1s, color 0.2s;
}

button:hover {
  color: #3b82f6;
}

button:active {
  transform: scale(0.95);
}

.mode-btn {
  font-size: 14px;
  color: #b3b3b3;
  width: 80px;
  text-align: left;
}

.mode-btn:hover {
  color: #fff;
}

.icon-btn {
  font-size: 24px;
}

.play-btn {
  font-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-btn:hover {
  color: #fff;
  transform: scale(1.05);
}

.play-btn:active {
  transform: scale(0.95);
}

.volume-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100px;
}

.volume-bar {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  background: #4d4d4d;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  transition: background 0.2s;
}

.volume-bar:hover {
  background: #666;
}

.volume-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
}

.volume-bar::-webkit-slider-thumb:hover {
  background: #3b82f6;
}
</style>
