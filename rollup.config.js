import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

export default [
  // ES Module build
  {
    input: 'src/main.js',
    output: {
      file: 'dist/sww.esm.js',
      format: 'es',
      sourcemap: !isProduction
    },
    plugins: [
      nodeResolve(),
      ...(isProduction ? [terser()] : [])
    ]
  },
  
  // UMD build for browser
  {
    input: 'src/main.js',
    output: {
      file: 'dist/sww.js',
      format: 'umd',
      name: 'SWW',
      sourcemap: !isProduction
    },
    plugins: [
      nodeResolve(),
      ...(isProduction ? [terser()] : [])
    ]
  },
  
  // Minified UMD build
  {
    input: 'src/main.js',
    output: {
      file: 'dist/sww.min.js',
      format: 'umd',
      name: 'SWW',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ]
  }
];
