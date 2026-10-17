import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: { port: 5173 },
  // MapLibre pèse à lui seul près d'un mégaoctet (320 Ko compressé).
  build: { chunkSizeWarningLimit: 1200 },
})
