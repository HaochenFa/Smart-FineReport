/** @type {import('jest').Config} */

/**
 * @file jest.config.js
 * @author Google Gemini
 * @description Jest Configuration
 */

module.exports = {
  // 1. 测试环境
  // 'node' (默认): 适用于后端 Node.js 项目 (如测试 API)
  // 'jsdom': 适用于前端项目，它会模拟一个浏览器环境 (提供 document, window 等对象)
  testEnvironment: 'jsdom',

  // 2. 设置测试文件的匹配规则
  // Jest 会在项目中寻找符合这些规则的文件来执行测试
  testMatch: [
    '**/__tests__/**/*.js?(x)', // 匹配 __tests__ 文件夹下的所有 js 或 jsx 文件
    '**/?(*.)+(spec|test).js?(x)', // 匹配所有以 .spec.js, .test.js, .spec.jsx, 或 .test.jsx 结尾的文件
  ],

  // 3. 模块查找路径
  // 告诉 Jest 在哪里查找模块，类似于 webpack 的 resolve.modules
  // 'node_modules' 是默认值，你也可以添加 'src' 等
  modulePaths: ['<rootDir>/src'],

  // 4. 设置文件转换器
  // Jest 默认只能理解原生 JavaScript。如果你的代码使用了 TypeScript, JSX, 或者新的 ES 语法
  // 你需要告诉 Jest 如何将这些代码转换为它能理解的 JS
  transform: {
    // 使用 babel-jest 来转换 .js 和 .jsx 文件
    '^.+\\.jsx?$': 'babel-jest',
    // 如果你使用 TypeScript, 你会在这里配置 ts-jest
    // '^.+\\.tsx?$': 'ts-jest',
  },

  // 5. 在运行测试前执行的设置文件
  // 这里的路径是相对于项目根目录的
  // 这个文件会在每个测试文件执行之前运行一次
  // 非常适合用来做全局的设置，比如引入 jest-dom
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // 6. 代码覆盖率配置
  // 告诉 Jest 在生成覆盖率报告时，应该统计哪些文件
  collectCoverageFrom: [
    'src/**/*.{js,jsx}', // 只统计 src 文件夹下的 JS/JSX 文件
    '!src/index.js', // 排除掉入口文件
    '!**/node_modules/**', // 排除所有第三方库
  ],
  // 覆盖率报告的输出目录
  coverageDirectory: 'coverage',
  // 覆盖率阈值，如果达不到这个标准，测试会失败
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10, // 允许有10行未被覆盖
    },
  },
};
