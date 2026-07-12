import { resolve } from 'path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

const DEV_SERVER_URL = 'http://127.0.0.1:8080'
const PROD_SERVER_URL = 'https://bear-password.xuewei.fun'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const serverUrl =
    env.VITE_SERVER_URL || (mode === 'production' ? PROD_SERVER_URL : DEV_SERVER_URL)

  return {
    base: '/app/',
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png'],
        manifest: {
          name: 'BearPassword',
          short_name: 'BearPassword',
          description: '简洁、安全、专业的密码管理工具',
          theme_color: '#6c5ce7',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/app/',
          scope: '/app/',
          icons: [
            {
              src: 'favicon.png',
              sizes: '192x192',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          navigateFallback: '/app/index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
        }
      })
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/variables.scss" as *; @use "@/styles/mixins.scss" as *;`
        }
      }
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: serverUrl,
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.ttf')) {
              return 'assets/TsangerJinKai05-W04-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          }
        }
      }
    }
  }
})
