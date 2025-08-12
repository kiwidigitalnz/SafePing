import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-switch'],
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge', 'zustand'],
          'vendor-charts': ['recharts'],
          'supabase': ['@supabase/supabase-js'],
          'tanstack': ['@tanstack/react-query']
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  plugins: [react()],
})
