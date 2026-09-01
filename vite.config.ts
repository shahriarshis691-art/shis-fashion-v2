import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    modulePreload: {
      polyfill: false,
    },
    chunkSizeWarningLimit: 1000,
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('/firebase/adminService') || id.includes('\\firebase\\adminService')) {
            return 'admin-service'
          }

          if (id.includes('firebase')) {
            return 'firebase'
          }

          if (id.includes('framer-motion')) {
            return 'motion'
          }

          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) {
            return 'react'
          }

          return undefined
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
