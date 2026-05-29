import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './', // 恢复为相对路径，完美适配任意部署环境
  resolve: {
    alias: {
      'jsmediatags': 'jsmediatags/dist/jsmediatags.min.js'
    }
  },
  server: {
    watch: {
      // 忽略监视音乐文件夹，防止大量 flac/mp3 等大文件拖垮 Vite 的文件系统监视器 (chokidar)
      ignored: ['**/public/songs/**']
    }
  }
})
