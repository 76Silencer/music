import { ref, computed, watch } from 'vue';
import { songs as librarySongs } from '../data/songs';

const audio = new Audio();
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(0.3); // 默认音量设置为 30%
const playMode = ref('sequence'); // 'sequence', 'loop', 'random'
const playlist = ref([]);
const currentSongIndex = ref(-1);
const lyrics = ref([]);
const currentLyricIndex = ref(-1);

const currentSong = computed(() => {
  if (currentSongIndex.value >= 0 && currentSongIndex.value < playlist.value.length) {
    return playlist.value[currentSongIndex.value];
  }
  return null;
});

const parseLrc = (lrcText) => {
  const lines = lrcText.split('\n');
  const parsed = [];
  const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
  
  for (const line of lines) {
    const match = line.match(timeReg);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = parseInt(match[3], 10);
      const time = min * 60 + sec + (ms / (match[3].length === 2 ? 100 : 1000));
      const text = line.replace(timeReg, '').trim();
      if (text) {
        parsed.push({ time, text });
      }
    }
  }
  return parsed;
};

const fetchLyrics = async (url) => {
  lyrics.value = [];
  currentLyricIndex.value = -1;
  const lrcUrl = url.replace(/\.(mp3|flac)$/i, '.lrc');
  try {
    const response = await fetch(lrcUrl);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      let text = '';
      try {
        // 尝试用 utf-8 解码，如果包含非 utf-8 字符（如 GBK）则会触发错误
        const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
        text = utf8Decoder.decode(buffer);
      } catch (e) {
        // 退回到使用 gbk 解码
        const gbkDecoder = new TextDecoder('gbk');
        text = gbkDecoder.decode(buffer);
      }
      lyrics.value = parseLrc(text);
    }
  } catch (err) {
    console.error('Failed to fetch lyrics:', err);
  }
};

// Initialize audio
audio.volume = volume.value;

audio.addEventListener('timeupdate', () => {
  currentTime.value = audio.currentTime;
  
  // Update lyric index
  if (lyrics.value.length > 0) {
    let index = lyrics.value.findIndex(l => l.time > currentTime.value) - 1;
    if (index === -2) {
      index = lyrics.value.length - 1; // All lyrics passed
    }
    currentLyricIndex.value = index;
  }
});

audio.addEventListener('loadedmetadata', () => {
  duration.value = audio.duration;
});

audio.addEventListener('ended', () => {
  handleEnded();
});

audio.addEventListener('play', () => {
  isPlaying.value = true;
});

audio.addEventListener('pause', () => {
  isPlaying.value = false;
});

watch(volume, (newVol) => {
  audio.volume = newVol;
});

const play = () => {
  if (!currentSong.value) return;
  
  // 浏览器底层对于中文等特殊字符或带有空格的文件名（如 FLAC），在赋给 audio.src 时会被自动 URL 编码。
  // 为了确保能够准确匹配到我们内存中的原路径，需要使用 decodeURIComponent 对 audio.src 进行解码比对。
  if (!audio.src || !decodeURIComponent(audio.src).endsWith(currentSong.value.url)) {
    loadSong(currentSongIndex.value);
  }
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.error("Playback prevented:", error);
    });
  }
};

const pause = () => {
  audio.pause();
};

const togglePlay = () => {
  if (isPlaying.value) {
    pause();
  } else {
    play();
  }
};

const loadSong = (index) => {
  if (index < 0 || index >= playlist.value.length) return;
  currentSongIndex.value = index;
  audio.src = playlist.value[index].url;
  audio.load();
  fetchLyrics(playlist.value[index].url);
};

const playSongById = (songId) => {
  const index = playlist.value.findIndex(s => s.id === songId);
  if (index !== -1) {
    loadSong(index);
    play();
  }
};

const next = (isAutoPlay = false) => {
  if (playlist.value.length === 0) return;
  
  let nextIndex = currentSongIndex.value + 1;
  
  if (playMode.value === 'loop' && isAutoPlay) {
    // 自动播放结束时，单曲循环保持播放当前歌曲
    nextIndex = currentSongIndex.value;
  } else if (playMode.value === 'random') {
    if (playlist.value.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * playlist.value.length);
      } while (nextIndex === currentSongIndex.value);
    } else {
      nextIndex = currentSongIndex.value;
    }
  } else {
    // 列表循环或手动切歌
    if (nextIndex >= playlist.value.length) {
      nextIndex = 0;
    }
  }
  
  loadSong(nextIndex);
  play();
};

const prev = (isAutoPlay = false) => {
  if (playlist.value.length === 0) return;
  
  let prevIndex = currentSongIndex.value - 1;
  
  if (playMode.value === 'loop' && isAutoPlay) {
    prevIndex = currentSongIndex.value;
  } else if (playMode.value === 'random') {
    if (playlist.value.length > 1) {
      do {
        prevIndex = Math.floor(Math.random() * playlist.value.length);
      } while (prevIndex === currentSongIndex.value);
    } else {
      prevIndex = currentSongIndex.value;
    }
  } else {
    if (prevIndex < 0) {
      prevIndex = playlist.value.length - 1;
    }
  }
  
  loadSong(prevIndex);
  play();
};

const handleEnded = () => {
  next(true); // true 表示是歌曲自然结束触发的自动切歌
};

const seek = (time) => {
  audio.currentTime = time;
  currentTime.value = time;
};

const setVolume = (val) => {
  volume.value = val;
};

const setPlayMode = (mode) => {
  playMode.value = mode;
};

const addToPlaylist = (song) => {
  // 1. 播放列表为空时，自动开始播放新加进来的歌曲
  if (playlist.value.length === 0) {
    playlist.value.push(song);
    loadSong(0);
    play();
    return;
  }

  const existingIndex = playlist.value.findIndex(s => s.id === song.id);
  
  // 2. 播放列表不为空的时候，再看看是不是当前播放的歌曲
  if (existingIndex !== -1 && existingIndex === currentSongIndex.value) {
    // 如果是，就不处理
    return;
  }

  if (existingIndex !== -1) {
    // 3. 如果不是，再看列表里有没有，如果有，移动至当前播放歌曲的下一首
    const item = playlist.value.splice(existingIndex, 1)[0];
    
    let currentIndex = currentSongIndex.value;
    // 如果原来的位置在当前播放歌曲之前，那么抽出它之后，当前播放歌曲的 index 会减 1
    if (existingIndex < currentIndex) {
      currentIndex--;
      currentSongIndex.value = currentIndex;
    }
    
    // 插入到当前播放歌曲的下一首
    playlist.value.splice(currentIndex + 1, 0, item);
  } else {
    // 4. 如果没有，就直接加到列尾
    playlist.value.push(song);
  }
};

const removeFromPlaylist = (songId) => {
  const index = playlist.value.findIndex(s => s.id === songId);
  if (index === -1) return;
  
  const wasPlaying = isPlaying.value; // 记住当前是否在播放
  
  playlist.value.splice(index, 1);
  if (playlist.value.length === 0) {
    pause();
    currentSongIndex.value = -1;
    audio.src = '';
  } else if (index === currentSongIndex.value) {
    // 移除的是当前正在播放（或暂停）的歌曲
    const nextIndex = index >= playlist.value.length ? 0 : index;
    loadSong(nextIndex);
    // 只有移除前是播放状态，才自动播放下一首；如果是暂停状态，就保持暂停
    if (wasPlaying) {
      play();
    }
  } else if (index < currentSongIndex.value) {
    currentSongIndex.value--;
  }
};

const moveSong = (oldIndex, newIndex) => {
  if (oldIndex === newIndex) return;
  if (newIndex < 0 || newIndex >= playlist.value.length) return;
  
  const currentId = currentSong.value?.id;
  
  const item = playlist.value.splice(oldIndex, 1)[0];
  playlist.value.splice(newIndex, 0, item);
  
  if (currentId) {
    currentSongIndex.value = playlist.value.findIndex(s => s.id === currentId);
  }
};

// 避免 Vite 热更新 (HMR) 导致的幽灵音频对象实例驻留问题
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    audio.pause();
    audio.src = '';
  });
}

export function useAudioPlayer() {
  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    playMode,
    currentSongIndex,
    currentSong,
    librarySongs,
    playlist,
    lyrics,
    currentLyricIndex,
    play,
    pause,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    setPlayMode,
    playSongById,
    addToPlaylist,
    removeFromPlaylist,
    moveSong
  };
}
