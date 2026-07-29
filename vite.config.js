import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  root: '.',
  server: {
    proxy: {
      // 本地开发时，将 /api 请求转发到线上 Worker
      // 部署后 Worker 自带托管前端，无需此 proxy
      '/api': {
        target: 'https://你的worker名.xxx.workers.dev',
        changeOrigin: true,
      },
    },
  },
})
