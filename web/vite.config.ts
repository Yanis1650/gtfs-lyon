import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 5173,
    // Les milliers de lignes calculées ne doivent pas recharger la page pendant leur génération.
    watch: { ignored: /[\\/]public[\\/]data[\\/]isochrones(?:[\\/]|$)/ },
  },
  // MapLibre pèse à lui seul près d'un mégaoctet (320 Ko compressé).
  build: { chunkSizeWarningLimit: 1200 },
})
