import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import {terser} from 'rollup-plugin-terser';
import pkg from './package.json';

// 判断当前是否是生产环境
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Rollup 配置文件
 */
export default {
  // 入口文件
  input: 'src/main.js',

  // 输出配置
  output: [
    // 1. UMD (Universal Module Definition) - 用于浏览器环境
    // 可以通过 <script> 标签直接引用
    {
      file: pkg.browser, // 'dist/smart-finereport.umd.js'
      format: 'umd',
      // UMD 模式下，需要指定一个全局变量名
      // 当在浏览器中引入时，模块内容会挂载到 window.SmartFineReport 上
      name: 'SmartFineReport',
      // 'named' 可以同时处理 default export 和 named exports
      exports: 'named',
      sourcemap: true,
      plugins: [
        // 仅在生产环境下进行代码压缩
        isProduction && terser()
      ]
    },

    // 2. CJS (CommonJS) - 用于 Node.js 环境
    {
      file: pkg.main, // 'dist/smart-finereport.cjs.js'
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },

    // 3. ESM (ES Module) - 用于现代浏览器和打包工具 (如 Webpack, Vite)
    {
      file: pkg.module, // 'dist/smart-finereport.esm.js'
      format: 'es',
      sourcemap: true
    }
  ],

  // 插件列表
  plugins: [
    // 解析 node_modules 中的模块
    resolve(),

    // 将 CommonJS 格式的模块转换为 ES6
    commonjs(),

    // 使用 Babel 进行代码转换 (ES6 -> ES5)
    babel({
      // babelHelpers: 'bundled' 会将 babel 的辅助函数内联到代码中
      babelHelpers: 'bundled',
      // 排除 node_modules 目录，因为它们通常已经是编译好的
      exclude: 'node_modules/**'
    })
  ],

  // 监听模式下的配置
  watch: {
    clearScreen: false
  }
};
