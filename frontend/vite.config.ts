import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In local dev the API runs separately on :8000; proxy the API paths so the
// app can use same-origin URLs everywhere (matching the deployed demo, where
// FastAPI serves the built frontend itself).
const API_TARGET = 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/parse-script': API_TARGET,
      '/upload-script': API_TARGET,
      '/health': API_TARGET,
    },
  },
})
