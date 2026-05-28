const fs = require('fs');
const path = require('path');

const musicDir = path.join(__dirname, 'public/music');
const files = fs.readdirSync(musicDir);

const songs = files.filter(file => file.endsWith('.mp3') || file.endsWith('.flac')).map((file, index) => {
  let title = file.replace(/\.(mp3|flac)$/i, '');
  let artist = '未知歌手';
  
  // 尝试解析 "歌手 - 歌名"
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  } else if (title.includes('-')) {
    const parts = title.split('-');
    artist = parts[0].trim();
    title = parts.slice(1).join('-').trim();
  }

  return {
    id: index + 1,
    title: title,
    artist: artist,
    url: `/music/${file}`,
    cover: `https://picsum.photos/seed/song${index+1}/300/300`
  };
});

const content = `export const songs = ${JSON.stringify(songs, null, 2)};\n`;
fs.writeFileSync(path.join(__dirname, 'src/data/songs.js'), content);
console.log(`Generated ${songs.length} songs`);
