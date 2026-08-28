import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // ensure assets resolve correctly when served from /mbmg
  base: '/mbmg',
  plugins: [react()],
})



