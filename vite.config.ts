import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  // Explicitly allow Tauri API paths to be resolved
  optimizeDeps: {
    exclude: ['@tauri-apps/api'],
  },
  // Ensure all imports from @tauri-apps are properly preserved
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  // Prevent Vite from obscuring Rust errors
  clearScreen: false,
})
