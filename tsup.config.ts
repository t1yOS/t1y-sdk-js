import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  target: 'es2017',
  outDir: 'dist',
  external: ['@system.fetch', '@system.storage'],
  esbuildOptions(options) {
    options.conditions = ['default']
  },
})
