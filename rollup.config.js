import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
import postcss from "rollup-plugin-postcss";
import alias from "@rollup/plugin-alias";
import svelte from "rollup-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";
import image from "@rollup/plugin-image";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Rollup 配置文件
 */
export default {
  onwarn(warning, warn) {
    // 忽略 d3-selection 的循环依赖警告
    if (warning.code === "CIRCULAR_DEPENDENCY" && warning.message.includes("node_modules")) {
      return;
    }
    // 其他警告照常处理
    warn(warning);
  },
  // 入口文件
  input: "src/main.js",
  // 输出配置
  output: [
    {
      file: "public/dist/smart-finereport.esm.min.js",
      format: "esm",
      sourcemap: true,
    },
    {
      file: "public/dist/smart-finereport.cjs.min.js",
      format: "cjs",
      sourcemap: true,
    },
  ],

  // 插件列表
  plugins: [
    // 解析 node_modules 中的模块
    resolve(),
    // 配置别名
    alias({
      entries: [{ find: "@", replacement: process.cwd() + "/src" }],
    }),
    // 图片内联打包插件
    image(),
    // 转换 CommonJS 模块为 ES6
    commonjs(),
    // Babel 转换
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
    }),

    // Svelte 插件
    svelte({
      preprocess: sveltePreprocess({
        postcss: true,
      }),
      emitCss: true, // 提取 Svelte 组件中的 CSS
      compilerOptions: {
        dev: !isProduction,
        hydratable: false,
        enableSourcemap: !isProduction,
      },
      onwarn: (warning, handler) => {
        // 忽略一些常见的警告
        if (warning.code === "css-unused-selector") return;
        handler(warning);
      },
    }),

    // PostCSS plugin to handle Tailwind CSS
    postcss({
      extract: (outputChunk) => {
        // outputChunk.fileName will be like 'smart-finereport.esm.min.js' or 'smart-finereport.cjs.min.js'
        // We want to replace '.js' with '.css'
        return outputChunk.fileName.replace(/\.js$/, ".css");
      },
      minimize: isProduction, // Minimize CSS in production
      sourceMap: !isProduction,
    }),

    // 生产环境下启用代码压缩
    isProduction && terser(),

    // 开发服务器配置 (仅在开发环境下生效)
    !isProduction &&
      serve({
        open: true, // 自动在浏览器中打开
        contentBase: ["public"], // 静态文件目录
        host: "localhost",
        port: 8080,
        // 将 bundle.js 映射到正确的输出文件
        onListening: function (server) {
          console.log("Server listening at http://localhost:8080/");
          const { address, port } = server.address();
          const host = address === "0.0.0.0" ? "localhost" : address;
          const url = `http://${host}:${port}`;
          console.log(`Open your browser and go to ${url}/index.html`);
        },
      }),

    // 实时重新加载 (仅在开发环境下生效)
    !isProduction &&
      livereload({
        watch: ["public"],
      }),
  ],

  // 监视文件变化 (仅在开发环境下生效)
  watch: {
    include: "src/**",
    exclude: "node_modules/**",
  },
};
