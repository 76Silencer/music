import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jsmediatags from 'jsmediatags';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const musicDir = path.join(__dirname, 'public/songs');
const coversDir = path.join(__dirname, 'public/covers');

if (fs.existsSync(coversDir)) {
  fs.rmSync(coversDir, { recursive: true, force: true });
}
fs.mkdirSync(coversDir, { recursive: true });

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
  const generatedIds = new Set(); // 用于记录已生成的 ID，防止碰撞

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

    // 根据文件名生成唯一的短 Hash ID
    const fullHash = crypto.createHash('md5').update(file).digest('hex');
    let songId = fullHash.substring(0, 6);
    
    // 兜底机制：如果前 6 位 Hash 发生了碰撞，就向后滑动截取窗口，直到找到不重复的 ID
    let offset = 0;
    while (generatedIds.has(songId)) {
      offset++;
      if (offset + 6 <= 32) {
        // 比如从第1位截取到第7位，第2位到第8位...
        songId = fullHash.substring(offset, offset + 6);
      } else {
        // 极端情况：32 位 MD5 内所有的 6 位切片全都撞了（理论上不可能发生）
        songId = fullHash.substring(0, 6) + offset;
      }
    }
    generatedIds.add(songId);

    const coverFileName = `cover_${songId}.jpg`;
    const coverFilePath = path.join(coversDir, coverFileName);
    const audioFilePath = path.join(musicDir, file);

    const hasCover = await extractCover(audioFilePath, coverFilePath);
    // 这里不再使用外部的 picsum.photos 占位图，而是直接在没有封面的情况下使用一个内置的默认封面图片，或者不设置 cover 字段
    const coverUrl = hasCover ? `./covers/${coverFileName}` : `./default-cover.svg`;

    songs.push({
      id: songId,
      no: index + 1, // 仅用于 UI 显示的视觉序号
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
