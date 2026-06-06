import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  server: {
    proxy: {
      '/api/hf': {
        target: 'https://router.huggingface.co',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/hf/, ''),
      },
      '/api/fal': {
        target: 'https://queue.fal.run',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/fal/, ''),
      },
    },
  },
})
