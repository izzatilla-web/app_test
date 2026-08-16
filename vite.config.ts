import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Honor an externally assigned port (dev tooling); falls back to Vite's default.
  server: process.env.PORT ? { port: Number(process.env.PORT) } : undefined,
})
