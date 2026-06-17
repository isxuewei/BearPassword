import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin, loadEnv } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

const DEV_SERVER_URL = 'http://127.0.0.1:8080'
const PROD_SERVER_URL = 'https://bear-password.xuewei.fun'

/**
 * electron-vite 统一配置文件
 * 显式指定入口路径（项目使用 electron/ 目录而非默认的 src/main）
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const serverUrl =
    env.VITE_SERVER_URL || (mode === 'production' ? PROD_SERVER_URL : DEV_SERVER_URL)

  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      build: {
        lib: {
          entry: resolve(__dirname, 'electron/main/index.ts')
        }
      },
      define: {
        'process.env.VITE_SERVER_URL': JSON.stringify(serverUrl)
      }
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
      build: {
        lib: {
          entry: resolve(__dirname, 'electron/preload/index.ts')
        }
      }
    },
    renderer: {
      root: '.',
      build: {
        rollupOptions: {
          input: resolve(__dirname, 'index.html')
        }
      },
      server: {
        proxy: {
          '/api': {
            target: serverUrl,
            changeOrigin: true
          }
        }
      },
      resolve: {
        alias: {
          '@': resolve('src')
        }
      },
      plugins: [vue()],
      css: {
        preprocessorOptions: {
          scss: {
            additionalData: `@use "@/styles/variables.scss" as *; @use "@/styles/mixins.scss" as *;`
          }
        }
      }
    }
  }
})
