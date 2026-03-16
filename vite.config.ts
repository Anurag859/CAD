import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
<<<<<<< HEAD
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
=======

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
>>>>>>> d79f0f8f80a9080099f96c2ea8f86c8c6cdd2a98
})
