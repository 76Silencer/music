<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { useAudioPlayer } from '../composables/useAudioPlayer';

const { currentSong, lyrics, currentLyricIndex, isPlaying, seek, play, currentTime } = useAudioPlayer();
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
  }, 3000);
};

const getLyricStyle = (line, index) => {
  if (index < currentLyricIndex.value) {
    return { '--progress': '100%', transition: 'none' };
  } else if (index > currentLyricIndex.value) {
    return { '--progress': '0%', transition: 'none' };
  } else {
    // 正在播放的当前句
    const passed = currentTime.value - line.time;
    // 限制单句变色的最大时长为 6 秒，防止长间奏导致染色卡住不动
    const duration = Math.min(line.duration, 6);
    const percentage = Math.min(100, Math.max(0, (passed / duration) * 100));
    
    // 如果刚跳转到这句（不到 0.3 秒），关闭渐变动画，防止出现颜色倒推的视觉拖影
    const transition = passed < 0.3 ? 'none' : 'background-size 0.25s linear';
    
    return { 
      '--progress': `${percentage}%`,
      transition
    };
  }
};

const scrollLyrics = async () => {
  await nextTick(); // 等待 Vue 重新渲染 DOM（确保 .active 类已更新到最新的一句）
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
              <span class="lyric-text" :style="getLyricStyle(line, index)">{{ line.text }}</span>
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
  padding: 250px 0; /* 加大上下 padding，使首尾歌词都能完全滚动到中间 */
  mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
  text-align: center;
}

.lyrics-container::-webkit-scrollbar {
  display: none;
}

.lyric-line {
  font-size: 16px;
  margin-bottom: 24px;
  transition: all 0.3s ease;
  min-height: 24px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 40px; /* 给右侧播放按钮留出空间，保持文字居中 */
}

.lyric-text {
  background-color: rgba(255,255,255,0.4);
  background-image: linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.8));
  background-size: var(--progress) 100%;
  background-repeat: no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: background-size 0.25s linear;
}

.lyric-line.active {
  font-size: 20px;
  font-weight: 600;
  transform: scale(1.05);
  filter: drop-shadow(0 0 8px rgba(255,255,255,0.3));
}

.lyric-line.active .lyric-text {
  background-color: #fff;
  background-image: linear-gradient(to right, #3b82f6, #3b82f6);
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
