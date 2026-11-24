import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Repassa o IP de quem acessou (X-Forwarded-For), para o limite de tentativas ser por pessoa
        xfwd: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Fotos enviadas (pets e relatórios), servidas pela API
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
