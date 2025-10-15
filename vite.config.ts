import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const base = process.env.VITE_BASE_PATH ?? '/'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
