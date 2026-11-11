import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'LiquidGlassButton',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      // Externalize React so library consumers provide their own
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'liquid-glass-button.css'
          return assetInfo.name || 'asset-[hash][extname]'
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    emptyOutDir: false,
  },
})
