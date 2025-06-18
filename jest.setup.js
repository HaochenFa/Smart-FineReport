/**
 * @file jest.setup.js
 * @author Google Gemini
 */

// 1. 扩展 Jest 的断言 (expect)
// 例如，在使用 @testing-library/react 时，我们希望有一些更方便的 DOM 断言
// 比如 expect(element).toBeInTheDocument()
// 这就需要引入 jest-dom

// npm install --save-dev @testing-library/jest-dom
import '@testing-library/jest-dom';

// 2. 设置全局的 Mocks
// 如果你的代码依赖于一些难以在测试环境中使用的全局对象或函数
// 比如 window.matchMedia 或 fetch API，可以在这里进行全局 Mock
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


// 3. 在所有测试运行前执行一次的钩子
beforeAll(() => {
  // console.log('所有测试即将开始...');
});

// 4. 在所有测试结束后执行一次的钩子
afterAll(() => {
  // console.log('所有测试已完成。');
});
