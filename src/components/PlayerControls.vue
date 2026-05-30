<script setup>
import { computed, ref, watch } from 'vue';
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

const isDragging = ref(false);
const localTime = ref(0);

// 当没有拖拽时，保持本地时间和真实播放时间同步
watch(currentTime, (newTime) => {
  if (!isDragging.value) {
    localTime.value = newTime;
  }
});

const formatTime = (time) => {
  if (!time || isNaN(time)) return '0:00';
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const handleSeekInput = (e) => {
  isDragging.value = true;
  localTime.value = Number(e.target.value);
};

const handleSeekChange = (e) => {
  seek(Number(e.target.value));
  isDragging.value = false;
};

const handleSeekEnd = () => {
  // 确保在手机端 touchend 时也能正确释放拖拽状态
  if (isDragging.value) {
    seek(localTime.value);
    isDragging.value = false;
  }
};

const handleVolume = (e) => {
  setVolume(Number(e.target.value));
};

const toggleMode = () => {
  const modes = ['order', 'sequence', 'loop', 'random'];
  const nextIndex = (modes.indexOf(playMode.value) + 1) % modes.length;
  setPlayMode(modes[nextIndex]);
};

const modeLabel = computed(() => {
  const map = {
    order: '⬇️ 顺序',
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
      <span class="time">{{ formatTime(localTime) }}</span>
      <input 
        type="range" 
        class="progress-bar" 
        :value="localTime" 
        :max="duration" 
        @input="handleSeekInput"
        @change="handleSeekChange"
        @touchend="handleSeekEnd"
        @mouseup="handleSeekEnd"
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
  height: 24px; /* 加大移动端触摸区域 */
  -webkit-appearance: none;
  background: transparent;
  outline: none;
  cursor: pointer;
  margin: 0;
}

.progress-bar::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  background: #4d4d4d;
  border-radius: 2px;
  transition: background 0.2s;
}

.progress-bar:hover::-webkit-slider-runnable-track {
  background: #666;
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  margin-top: -5px; /* (4px - 14px) / 2 */
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
  height: 24px; /* 加大移动端触摸区域 */
  -webkit-appearance: none;
  background: transparent;
  outline: none;
  cursor: pointer;
  margin: 0;
}

.volume-bar::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  background: #4d4d4d;
  border-radius: 2px;
  transition: background 0.2s;
}

.volume-bar:hover::-webkit-slider-runnable-track {
  background: #666;
}

.volume-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  margin-top: -4px;
}

.volume-bar::-webkit-slider-thumb:hover {
  background: #3b82f6;
}

@media (max-width: 768px) {
  .controls-row {
    position: relative;
    justify-content: center;
  }
  
  .mode-btn {
    position: absolute;
    left: 0;
    width: auto;
  }
  
  .volume-container {
    position: absolute;
    right: 0;
    width: 70px;
  }
  
  .volume-container span {
    display: none; /* 移动端隐藏音量图标以节省空间 */
  }
  
  .main-controls {
    gap: 15px;
  }
  
  .play-btn {
    font-size: 36px;
  }
}
</style>
