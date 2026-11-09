import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11', 'chrome >= 60', 'safari >= 11', 'ios >= 11', 'android >= 6'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],
})
