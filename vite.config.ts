import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/kids-learning/',
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    modulePreload: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        hoistTransitiveImports: false,
        inlineDynamicImports: false,
        manualChunks: undefined,
      },
    },
  },
  css: {
    // 确保 CSS 不动态注入，用 link 标签加载
    devSourcemap: false,
  },
})
