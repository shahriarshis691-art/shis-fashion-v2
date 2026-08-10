import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('react')) {
            return 'react'
          }

          if (id.includes('firebase')) {
            return 'firebase'
          }

          if (id.includes('framer-motion')) {
            return 'motion'
          }

          return 'vendor'
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
    watch: {
      ignored: ['**/public/media/hero-fallback.mp4'],
      ignorePermissionErrors: true,
    },
  },
})
