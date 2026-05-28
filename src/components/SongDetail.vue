<script setup>
import { ref, watch, onMounted } from 'vue';
import { useAudioPlayer } from '../composables/useAudioPlayer';

const { currentSong, lyrics, currentLyricIndex, isPlaying, seek, play } = useAudioPlayer();
const lyricsContainer = ref(null);

// 定义可以触发向父组件的事件
const emit = defineEmits(['close']);

let scrollTimeout = null;
const isUserScrolling = ref(false);

const handleUserInteraction = () => {
  isUserScrolling.value = true;
  if (scrollTimeout) clearTimeout(scrollTimeout);
  // 用户停止交互 3 秒后，恢复自动滚动
  scrollTimeout = setTimeout(() => {
    isUserScrolling.value = false;
    scrollLyrics();
  }, 10000);
};

const scrollLyrics = () => {
  if (!lyricsContainer.value || currentLyricIndex.value < 0 || isUserScrolling.value) return;
  
  const activeLyric = lyricsContainer.value.querySelector('.lyric-line.active');
  if (activeLyric) {
    // 居中对齐滚动
    const containerHeight = lyricsContainer.value.clientHeight;
    const offsetTop = activeLyric.offsetTop;
    const scrollPosition = offsetTop - containerHeight / 2 + activeLyric.clientHeight / 2;
    
    lyricsContainer.value.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });
  }
};

const playFromLyric = (time) => {
  // 点击歌词立刻跳转，并恢复自动滚动
  isUserScrolling.value = false;
  if (scrollTimeout) clearTimeout(scrollTimeout);
  
  seek(time);
  if (!isPlaying.value) {
    play();
  }
};

watch(currentLyricIndex, () => {
  scrollLyrics();
});

onMounted(() => {
  setTimeout(scrollLyrics, 100);
});
</script>

<template>
  <div class="song-detail">
    <button class="close-btn" @click="emit('close')">
      <span>↓</span> 收起
    </button>
    
    <div class="detail-content" v-if="currentSong">
      <!-- 左侧封面区域 -->
      <div class="cover-section">
        <div class="cd-wrapper" :class="{ 'playing': isPlaying }">
          <img :src="currentSong.cover" class="large-cover" alt="cover" />
        </div>
      </div>
      
      <!-- 右侧歌词区域 -->
      <div class="lyrics-section">
        <h2 class="song-title">{{ currentSong.title }}</h2>
        <div class="song-artist">{{ currentSong.artist }}</div>
        
        <div 
          class="lyrics-container" 
          ref="lyricsContainer"
          @wheel="handleUserInteraction"
          @touchstart="handleUserInteraction"
          @touchmove="handleUserInteraction"
        >
          <template v-if="lyrics.length > 0">
            <div 
              v-for="(line, index) in lyrics" 
              :key="index"
              class="lyric-line"
              :class="{ 'active': currentLyricIndex === index }"
            >
              <span class="lyric-text">{{ line.text }}</span>
              <button class="play-lyric-btn" @click.stop="playFromLyric(line.time)" title="从此处播放">▶</button>
            </div>
          </template>
          <div v-else class="no-lyrics">
            暂无歌词
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      当前没有播放的歌曲
    </div>
  </div>
</template>

<style scoped>
.song-detail {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(20, 20, 25, 0.95);
  backdrop-filter: blur(30px);
  z-index: 10;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease forwards;
}

@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.close-btn {
  position: absolute;
  top: 20px;
  left: 30px;
  background: rgba(255,255,255,0.1);
  border: none;
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  transition: all 0.2s;
  z-index: 20;
}

.close-btn:hover {
  background: rgba(255,255,255,0.2);
}

.detail-content {
  display: flex;
  flex: 1;
  padding: 60px 40px 40px;
  gap: 60px;
  align-items: stretch;
  justify-content: center;
  min-height: 0;
}

/* 左侧封面特效 */
.cover-section {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.cd-wrapper {
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: #111;
  border: 8px solid rgba(255,255,255,0.1);
  box-shadow: 0 0 40px rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.cd-wrapper::after {
  content: '';
  position: absolute;
  width: 50px;
  height: 50px;
  background: #1a1a2e;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.2);
}

.large-cover {
  width: 210px;
  height: 210px;
  border-radius: 50%;
  object-fit: cover;
  animation: spin 20s linear infinite;
  animation-play-state: paused;
}

.cd-wrapper.playing .large-cover {
  animation-play-state: running;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 右侧歌词特效 */
.lyrics-section {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 500px;
  min-height: 0;
}

.song-title {
  font-size: 28px;
  color: #fff;
  margin: 0 0 10px 0;
  text-align: center;
}

.song-artist {
  font-size: 16px;
  color: #b3b3b3;
  margin-bottom: 30px;
  text-align: center;
}

.lyrics-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
  mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
  text-align: center;
}

.lyrics-container::-webkit-scrollbar {
  display: none;
}

.lyric-line {
  font-size: 16px;
  color: rgba(255,255,255,0.4);
  margin-bottom: 24px;
  transition: all 0.3s ease;
  min-height: 24px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 40px; /* 给右侧播放按钮留出空间，保持文字居中 */
}

.lyric-line.active {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(255,255,255,0.3);
  transform: scale(1.05);
}

.play-lyric-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: #b3b3b3;
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s, background 0.2s;
  padding: 6px 10px;
  border-radius: 6px;
}

.lyric-line:hover .play-lyric-btn {
  opacity: 1;
}

.play-lyric-btn:hover {
  color: #fff;
  background: rgba(59, 130, 246, 0.8);
}

.no-lyrics, .empty-state {
  color: #b3b3b3;
  text-align: center;
  margin-top: 100px;
  font-size: 18px;
}
</style>
