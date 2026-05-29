import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jsmediatags from 'jsmediatags';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const musicDir = path.join(__dirname, 'public/songs');
const coversDir = path.join(__dirname, 'public/covers');

if (!fs.existsSync(coversDir)) {
  fs.mkdirSync(coversDir, { recursive: true });
}

let files = [];
try {
  files = fs.readdirSync(musicDir);
} catch (e) {
  console.log('No public/songs directory found or empty.');
}

const extractCover = (filePath, coverPath) => {
  return new Promise((resolve) => {
    jsmediatags.read(filePath, {
      onSuccess: function(tag) {
        const picture = tag.tags.picture;
        if (picture) {
          try {
            const buffer = Buffer.from(picture.data);
            fs.writeFileSync(coverPath, buffer);
            resolve(true);
          } catch (e) {
            resolve(false);
          }
        } else {
          resolve(false);
        }
      },
      onError: function(error) {
        resolve(false);
      }
    });
  });
};

async function generate() {
  const validFiles = files.filter(file => file.endsWith('.mp3') || file.endsWith('.flac'));
  const songs = [];

  for (let index = 0; index < validFiles.length; index++) {
    const file = validFiles[index];
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

    const coverFileName = `cover_${index + 1}.jpg`;
    const coverFilePath = path.join(coversDir, coverFileName);
    const audioFilePath = path.join(musicDir, file);

    const hasCover = await extractCover(audioFilePath, coverFilePath);
    const coverUrl = hasCover ? `./covers/${coverFileName}` : `https://picsum.photos/seed/song${index+1}/300/300`;

    songs.push({
      id: index + 1,
      title: title,
      artist: artist,
      url: `./songs/${file}`,
      cover: coverUrl
    });
  }

  const content = `export const songs = ${JSON.stringify(songs, null, 2)};\n`;
  fs.writeFileSync(path.join(__dirname, 'src/data/songs.js'), content);
  console.log(`✅ 已自动扫描曲库，共生成 ${songs.length} 首歌曲数据，并提取了相应的封面。`);
}

generate();
