/** @type {import('jest').Config} */

/**
 * @file jest.config.js
 * @author Google Gemini
 * @description Jest Configuration
 */

// 使用 ES Module 的 `export default` 语法
export default {
  // 1. 测试环境
  // 'node' (默认): 适用于后端 Node.js 项目
  // 'jsdom': 适用于前端项目, 它会模拟一个浏览器环境
  testEnvironment: 'jsdom',

  // 2. 设置测试文件的匹配规则
  testMatch: [
    '**/__tests__/**/*.js?(x)',
    '**/?(*.)+(spec|test).js?(x)',
  ],

  // 3. 模块查找路径 (在 ESM 项目中, 这个选项可能需要配合其他设置使用)
  modulePaths: ['<rootDir>/src'], // 如果遇到模块解析问题可以启用
  moduleNameMapper: {
    // Creates an alias. Now, "@/path/to/file" will resolve to "<rootDir>/src/path/to/file".
    // 创建一个别名。现在, "@/path/to/file" 将会解析到 "<rootDir>/src/path/to/file"。
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock CSS imports to prevent Jest from trying to parse them
    '\\.css$': '<rootDir>/src/utils/__mocks__/styleMock.js',
  },

  // 4. 设置文件转换器
  // 对于 ESM 项目, 确保 Babel 或 ts-jest 配置正确
  transform: {
    // 使用 babel-jest 来转换 .js 和 .jsx 文件
    '^.+\\.jsx?$': 'babel-jest',
  },

  // 5. 在运行测试前执行的设置文件
  // setupFilesAfterEnv 依然有效
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // 6. 代码覆盖率配置
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text'],
};