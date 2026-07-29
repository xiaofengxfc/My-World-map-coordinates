import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  root: '.',
  server: {
    proxy: {
      // 本地开发时，将 /api 请求转发到本地 Worker (wrangler dev → 8787)
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
