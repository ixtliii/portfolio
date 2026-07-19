import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `base` must match the GitHub repo name when hosting on GitHub Pages at
// username.github.io/<repo>/. If you rename the repo, change it here only —
// every asset path in the app derives from import.meta.env.BASE_URL.
export default defineConfig({
  base: '/portfolio/',
  plugins: [react()],
})
