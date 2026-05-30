import { ref, computed, watch } from 'vue';
import { songs as initialSongs } from '../data/songs';
import * as jsmediatags from 'jsmediatags';

const audio = new Audio();
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(Number(localStorage.getItem('player_volume') || 0.3)); // 默认音量 30%，优先从 localStorage 读取
const playMode = ref(localStorage.getItem('player_playMode') || 'order'); // 'order', 'sequence', 'loop', 'random'
const playlist = ref([]);
const currentSongIndex = ref(-1);
const loadedSongId = ref(null);
const lyrics = ref([]);
const currentLyricIndex = ref(-1);
const librarySongs = ref([...initialSongs]);

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

  // 计算每句歌词的持续时间（用于卡拉OK逐字变色效果）
  for (let i = 0; i < parsed.length; i++) {
    if (i < parsed.length - 1) {
      parsed[i].duration = parsed[i + 1].time - parsed[i].time;
    } else {
      parsed[i].duration = 5; // 最后一句默认给 5 秒
    }
  }

  return parsed;
};

const fetchLyrics = async (url) => {
  lyrics.value = [];
  currentLyricIndex.value = -1;
  // url e.g., "./music/song1.mp3" -> "./music/song1.lrc"
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
  
  // 兜底保障：有些移动端浏览器在真正播放前不会触发 loadedmetadata，在 timeupdate 时强制同步一次正确的总时长
  if (audio.duration && !isNaN(audio.duration) && duration.value !== audio.duration) {
    duration.value = audio.duration;
  }
  
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
  if (audio.duration && !isNaN(audio.duration)) {
    duration.value = audio.duration;
  }
});

audio.addEventListener('durationchange', () => {
  if (audio.duration && !isNaN(audio.duration)) {
    duration.value = audio.duration;
  }
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
  localStorage.setItem('player_volume', newVol);
});

watch(playMode, (newMode) => {
  localStorage.setItem('player_playMode', newMode);
});

const play = () => {
  if (!currentSong.value) return;
  
  if (loadedSongId.value !== currentSong.value.id) {
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
  const song = playlist.value[index];
  
  loadedSongId.value = song.id;
  audio.src = song.url;
  audio.load();
  
  // 更新系统级媒体控制通知 (Media Session API)
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: 'Vue Music Player',
      artwork: [
        { src: song.cover, sizes: '300x300', type: 'image/jpeg' },
        { src: song.cover, sizes: '512x512', type: 'image/jpeg' }
      ]
    });
    
    // 绑定系统锁屏控制按钮事件
    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', pause);
    navigator.mediaSession.setActionHandler('previoustrack', prev);
    navigator.mediaSession.setActionHandler('nexttrack', next);
  }
  
  if (song.isLocal || song.url.startsWith('blob:')) {
    lyrics.value = [];
    currentLyricIndex.value = -1;
    if (song.lrcFile) {
      song.lrcFile.arrayBuffer().then(buffer => {
        let text = '';
        try {
          const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
          text = utf8Decoder.decode(buffer);
        } catch (e) {
          const gbkDecoder = new TextDecoder('gbk');
          text = gbkDecoder.decode(buffer);
        }
        lyrics.value = parseLrc(text);
      }).catch(err => console.error('Failed to read local lyrics:', err));
    }
  } else {
    fetchLyrics(song.url);
  }
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
  let shouldPause = false;
  
  if (playMode.value === 'loop' && isAutoPlay === true) {
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
    // 顺序播放 ('order')，列表循环 ('sequence') 或手动切歌
    if (nextIndex >= playlist.value.length) {
      nextIndex = 0;
      // 如果是顺序播放模式，并且是歌曲自然结束触发的自动切歌，则回到第一首并暂停
      if (playMode.value === 'order' && isAutoPlay === true) {
        shouldPause = true;
      }
    }
  }
  
  loadSong(nextIndex);
  if (!shouldPause) {
    play();
  }
};

const prev = (isAutoPlay = false) => {
  if (playlist.value.length === 0) return;
  
  let prevIndex = currentSongIndex.value - 1;
  
  if (playMode.value === 'loop' && isAutoPlay === true) {
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
  
  // 立刻同步更新当前歌词高亮索引，消除歌词滚动的视觉延迟
  if (lyrics.value.length > 0) {
    let index = lyrics.value.findIndex(l => l.time > time) - 1;
    if (index === -2) {
      index = lyrics.value.length - 1; // 所有歌词都已通过
    }
    currentLyricIndex.value = index;
  }
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
    loadedSongId.value = null;
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

const extractCover = (file) => {
  return new Promise((resolve) => {
    jsmediatags.read(file, {
      onSuccess: function(tag) {
        const picture = tag.tags.picture;
        if (picture) {
          let base64String = "";
          for (let i = 0; i < picture.data.length; i++) {
            base64String += String.fromCharCode(picture.data[i]);
          }
          const base64 = "data:" + picture.format + ";base64," + window.btoa(base64String);
          resolve(base64);
        } else {
          resolve(null);
        }
      },
      onError: function(error) {
        resolve(null);
      }
    });
  });
};

const addLocalFolder = () => {
  // 即使在非安全环境 (HTTP) 下也能通过 input 标签选择文件夹，规避了 showDirectoryPicker 对 HTTPS 的强制要求
  const input = document.createElement('input');
  input.type = 'file';
  input.webkitdirectory = true;
  input.directory = true;
  input.multiple = true;
  
  input.onchange = async (e) => {
    const files = Array.from(e.target.files);
    const localSongs = [];
    
    for (const file of files) {
      if (file.name.toLowerCase().endsWith('.mp3') || file.name.toLowerCase().endsWith('.flac')) {
        const url = URL.createObjectURL(file);
        
        let baseName = file.name.replace(/\.(mp3|flac)$/i, '');
        let title = baseName;
        let artist = '本地音乐';
        
        if (title.includes(' - ')) {
          const parts = title.split(' - ');
          artist = parts[0].trim();
          title = parts.slice(1).join(' - ').trim();
        } else if (title.includes('-')) {
          const parts = title.split('-');
          artist = parts[0].trim();
          title = parts.slice(1).join('-').trim();
        }
        
        const lrcFile = files.find(f => {
          // 处理带有 webkitRelativePath 的情况（Chrome / Edge 的完整目录结构）
          if (f.webkitRelativePath && file.webkitRelativePath) {
            return f.webkitRelativePath.toLowerCase() === file.webkitRelativePath.replace(/\.(mp3|flac)$/i, '.lrc').toLowerCase();
          }
          // 降级处理：直接比较文件名
          return f.name.toLowerCase() === file.name.replace(/\.(mp3|flac)$/i, '.lrc').toLowerCase();
        });

        // 提取本地音频文件的内置封面
        const cover = await extractCover(file) || `./default-cover.svg`;
        
        // 首字母取 g~z，后接 5 位十六进制字符，保证 6 位长度且绝不和云端 MD5(0~9, a~f) 发生冲突
        const firstChars = 'ghijklmnopqrstuvwxyz';
        const firstChar = firstChars[Math.floor(Math.random() * firstChars.length)];
        const rest = Math.floor(Math.random() * 0xfffff).toString(16).padStart(5, '0');
        const localId = firstChar + rest;

        localSongs.push({
          id: localId,
          title,
          artist,
          url,
          cover,
          isLocal: true,
          file: file,
          lrcFile: lrcFile || null
        });
      }
    }
    
    if (localSongs.length > 0) {
      librarySongs.value.push(...localSongs);
      alert(`成功添加 ${localSongs.length} 首本地歌曲！`);
    } else {
      alert('在该文件夹中没有找到 mp3 或 flac 格式的音乐。');
    }
    
    // 清理创建的 DOM 元素
    input.remove();
  };
  
  input.click();
};

// 监听播放列表的歌曲ID变化，实时更新到地址栏 URL 参数中
const playlistIds = computed(() => playlist.value.map(s => s.id).join(','));
watch(playlistIds, (newIds) => {
  const url = new URL(window.location);
  if (newIds) {
    // 绕过标准 API 的自动转义，手动拼接查询参数，保留原始逗号
    window.history.replaceState({}, '', `${url.pathname}?list=${newIds}`);
  } else {
    // 列表为空时，清空参数
    window.history.replaceState({}, '', url.pathname);
  }
});

// 初始化时从 URL 读取播放列表
const initPlaylistFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const listParam = urlParams.get('list');
  if (listParam) {
    const ids = listParam.split(',');
    const initialPlaylist = [];
    ids.forEach(id => {
      // 只能匹配服务器曲库的歌曲，本地临时导入的歌曲无法通过 URL 恢复
      // 使用 String 转换以兼容新版 Hash ID 和旧版数字 ID
      const song = librarySongs.value.find(s => String(s.id) === String(id));
      if (song) {
        initialPlaylist.push(song);
      }
    });
    if (initialPlaylist.length > 0) {
      playlist.value = initialPlaylist;
      // 预加载第一首歌，但不播放，保持初始暂停状态
      loadSong(0);
    }
  }
};

// 立即执行初始化
initPlaylistFromUrl();

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
    moveSong,
    addLocalFolder
  };
}
