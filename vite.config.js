import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Dev-only. Lets the browser treat the API as same-origin so the
      // httpOnly refresh cookie is set without SameSite=None in local dev.
      '/v1': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
