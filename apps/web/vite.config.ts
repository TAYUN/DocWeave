import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Match the Adonis dev server host so local editor flows can reach the API through Vite.
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
})
