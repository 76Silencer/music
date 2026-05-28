import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const musicDir = path.join(__dirname, 'public/music');
let files = [];

try {
  files = fs.readdirSync(musicDir);
} catch (e) {
  console.log('No public/music directory found or empty.');
}

const songs = files.filter(file => file.endsWith('.mp3') || file.endsWith('.flac')).map((file, index) => {
  let title = file.replace(/\.(mp3|flac)$/i, '');
  let artist = '未知歌手';
  
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
console.log(`✅ 已自动扫描曲库，共生成 ${songs.length} 首歌曲数据。`);
