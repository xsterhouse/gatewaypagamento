import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { apiPlugin } from './vite-api-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  server: {
    proxy: {
      '/api/resend': {
        target: 'https://api.resend.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/resend/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Adicionar API Key no header
            const apiKey = process.env.VITE_RESEND_API_KEY
            if (apiKey) {
              proxyReq.setHeader('Authorization', `Bearer ${apiKey}`)
            }
          })
        }
      }
    }
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Evitar múltiplas cópias do React
        return id === 'react' || id === 'react-dom' ? false : false
      }
    }
  }
})