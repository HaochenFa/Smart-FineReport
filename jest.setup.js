/**
 * @file jest.setup.js
 * @author Google Gemini
 */

// 1. 扩展 Jest 的断言 (expect)
import '@testing-library/jest-dom';

// 2. 导入 Jest 的全局工具对象
// 在纯 ESM 环境下，'jest' 对象必须被显式导入。
// 4. 在所有测试运行前执行一次的钩子
// beforeAll, afterAll 等 Jest 全局函数不需要导入。
// 如果它们也报错，同样可以从 '@jest/globals' 导入。
import {afterAll, beforeAll, jest} from '@jest/globals';

// 3. 设置全局的 Mocks
// 示例：Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

beforeAll(() => {
  // console.log('所有测试即将开始...');
});

// 4. 在所有测试结束后执行一次的钩子
afterAll(() => {
  // console.log('所有测试已完成。');
});
