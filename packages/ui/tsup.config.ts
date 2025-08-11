import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/components/*.tsx', 'src/lib/*.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
})