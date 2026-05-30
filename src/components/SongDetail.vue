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

const getCharStyle = (line, charIndex, totalChars) => {
  const passed = currentTime.value - line.time;
  const estimatedSingingTime = totalChars * 0.35;
  const playDuration = Math.min(line.duration, estimatedSingingTime);
  
  const charDuration = playDuration / totalChars;
  const charStartTime = charIndex * charDuration;
  
  let percentage = 0;
  if (passed >= charStartTime + charDuration) {
    percentage = 100;
  } else if (passed <= charStartTime) {
    percentage = 0;
  } else {
    percentage = ((passed - charStartTime) / charDuration) * 100;
  }
  
  // 当刚跳过时关闭动画防止倒退拖影
  const transition = passed < 0.3 ? 'none' : 'background-size 0.25s linear';
  
  return { 
    '--char-progress': `${percentage}%`,
    transition
  };
};

const scrollLyrics = async () => {
  await nextTick(); // 等待 Vue 重新渲染 DOM（确保 .active 类已更新到最新的一句）
  if (!lyricsContainer.value || currentLyricIndex.value < 0 || isUserScrolling.value) return;
  
  const activeLyric = lyricsContainer.value.querySelector('.lyric-line.active');
  if (activeLyric) {
    // 居中对齐滚动
    const containerHeight = lyricsContainer.value.clientHeight;
    const offsetTop = activeLyric.offsetTop;
    
    // 网页端因为上方有标题和歌手名占据了空间，导致歌词容器本身的视觉中心偏下
    // 这里额外增加 80px 的向下滚动量，让高亮歌词在屏幕上“向上提”，与左侧唱片完美水平对齐
    const alignOffset = window.innerWidth > 768 ? 80 : 20;
    const scrollPosition = offsetTop - containerHeight / 2 + activeLyric.clientHeight / 2 + alignOffset;
    
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
          <img :src="currentSong.cover" class="large-cover" alt="cover" @error="currentSong.cover = './default-cover.svg'" />
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
              <div class="lyric-text-wrapper">
                <template v-if="currentLyricIndex === index">
                  <span 
                    v-for="(char, charIndex) in line.text" 
                    :key="charIndex"
                    class="lyric-char"
                    :style="getCharStyle(line, charIndex, line.text.length)"
                  >{{ char }}</span>
                </template>
                <template v-else>
                  <span class="lyric-text" :class="{ 'played': index < currentLyricIndex }">{{ line.text }}</span>
                </template>
              </div>
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
  position: relative; /* 关键：让内部歌词的 offsetTop 相对于此容器计算 */
  mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
  text-align: center;
  display: flex;
  flex-direction: column;
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

.lyric-text-wrapper {
  display: inline;
}

.lyric-text {
  color: rgba(255, 255, 255, 0.4);
  transition: color 0.3s ease;
}

.lyric-text.played {
  color: rgba(255, 255, 255, 0.8);
}

.lyric-line.active {
  font-size: 20px;
  font-weight: 600;
  transform: scale(1.05);
  filter: drop-shadow(0 0 8px rgba(255,255,255,0.3));
}

.lyric-char {
  background-color: #fff;
  background-image: linear-gradient(to right, #3b82f6, #3b82f6);
  background-size: var(--char-progress, 0%) 100%;
  background-repeat: no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
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

.no-lyrics {
  color: #b3b3b3;
  text-align: center;
  margin: auto; /* 关键：结合 flex 容器让其绝对居中 */
  font-size: 18px;
}

.empty-state {
  color: #b3b3b3;
  text-align: center;
  margin-top: 100px;
  font-size: 18px;
}

@media (max-width: 768px) {
  .detail-content {
    flex-direction: column;
    padding: 20px 20px 20px; /* 减小顶部 padding，原来是 60px */
    gap: 15px;
    align-items: center;
    justify-content: flex-start;
  }
  
  .cover-section {
    flex: none;
    justify-content: center;
    margin-top: 10px;
  }
  
  .cd-wrapper {
    width: 160px;
    height: 160px;
    border-width: 4px;
  }
  
  .large-cover {
    width: 110px;
    height: 110px;
  }
  
  .lyrics-section {
    flex: 1;
    width: 100%;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0; /* 关键：允许 flex 子项收缩 */
  }
  
  .song-title {
    font-size: 20px;
    margin-bottom: 6px;
  }
  
  .song-artist {
    margin-bottom: 10px;
    font-size: 14px;
  }
  
  .lyrics-container {
    padding: 0; /* 在手机上如果没有歌词，取消 padding 以保证完全居中 */
  }
  
  .lyrics-container:has(.lyric-line) {
    padding: 120px 0; /* 如果有歌词，才保留上下滚动 padding */
  }
  
  .lyric-line {
    padding: 0 20px;
    font-size: 14px;
  }
  
  .lyric-line.active {
    font-size: 18px;
  }
}
</style>
