import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173, // Fix the port so it's consistent
    hmr: {
      overlay: true, // Shows errors on your phone screen if it fails
    },
    watch: {
      usePolling: true, // Better for network-shared development
    }
  },
})