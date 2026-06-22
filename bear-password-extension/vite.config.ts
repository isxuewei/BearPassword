import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import { resolve } from 'node:path'
import manifest from './manifest.config'

export default defineConfig(({ mode }) => ({
  plugins: [vue(), crx({ manifest })],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // 扩展开发时 HMR 会在 reload 后让旧 content script 的端口失效，关闭后可减少报错
  server: mode === 'development' ? { hmr: false } : undefined,
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        wake: resolve(__dirname, 'src/wake/index.html')
      }
    }
  }
}))
