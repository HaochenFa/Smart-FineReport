/**
 * @file main.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for main.js
 */

import {jest, describe, it, expect, beforeEach, beforeAll} from "@jest/globals";

// Mocks Setup - 模拟依赖模块

// 创建一个可重置的模拟 init 方法
const mockInit = jest.fn();
// 模拟 AppController 实例
const mockAppControllerInstance = {
  init: mockInit,
};
// 模拟 AppController 构造函数
const mockAppControllerConstructor = jest.fn(() => mockAppControllerInstance);

// 模拟 Logger 模块
const mockLogger = {
  setLevel: jest.fn(), log: jest.fn(), error: jest.fn(),
};

// 模拟 Settings 常量
const MOCK_SETTINGS = {
  logger: {
    level: 'debug'
  },
  service: { // Add the missing service property
    url: 'http://fake-service.com'
  }
};

// 使用 jest.unstable_mockModule 来模拟 ESM 模块
// 这是 Jest 推荐的、与 ESM 兼容的模拟方式
jest.unstable_mockModule('@/app/app-controller.js', () => ({
  default: mockAppControllerConstructor,
}));

jest.unstable_mockModule('@/utils/logger.js', () => ({
  Logger: mockLogger,
}));

jest.unstable_mockModule('@/utils/settings.js', () => ({
  SETTINGS: MOCK_SETTINGS,
}));


// Test Suite - 测试套件

describe('initializeAIAssistant', () => {

  // 在所有测试开始前，动态导入被测试的模块
  // 必须在 mock 定义之后进行 import
  beforeAll(async () => {
    await import('@/main.js');
  });

  // 在每个测试用例运行前，重置所有模拟函数和 DOM
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = ''; // 清理 jsdom 环境，确保测试隔离

    // 重置在测试中可能被修改的 mock 实现 防止一个测试用例的 mock 行为（如抛出错误）泄漏到下一个测试用例中
    mockAppControllerConstructor.mockImplementation(() => mockAppControllerInstance);
    mockInit.mockImplementation(() => {
    }); // 重置 init 的实现为一个无操作的函数
  });

  // Test Case 1: 验证函数是否正确挂载到 window 对象
  it('should correctly attach initializeAIAssistant to the window object', () => {
    expect(window.initAIAssistant).toBeDefined();
    expect(typeof window.initAIAssistant).toBe('function');
  });

  // Test Case 2: 验证日志级别是否被正确设置
  it('should call Logger.setLevel with the correct level from settings', () => {
    const validOptions = {
      containerSelector: '#test-container', fineReportInstance: {},
    };
    document.body.innerHTML = `<div id="test-container"></div>`;

    window.initAIAssistant(validOptions);

    expect(mockLogger.setLevel).toHaveBeenCalledTimes(1);
    expect(mockLogger.setLevel).toHaveBeenCalledWith(MOCK_SETTINGS.logger.level);
  });

  // Test Case 3: 验证 "成功路径"
  it('should call AppController constructor and its init method with correct arguments when options are valid', () => {
    const validOptions = {
      containerSelector: '#app', fineReportInstance: {
        someApi: () => {
        }
      },
    };
    document.body.innerHTML = `<div id="app"></div>`;

    window.initAIAssistant(validOptions);

    // 验证 AppController 构造函数被调用，并传入了正确的配置
    expect(mockAppControllerConstructor).toHaveBeenCalledTimes(1);
    expect(mockAppControllerConstructor).toHaveBeenCalledWith(MOCK_SETTINGS.service.url);

    // 验证 app.init 方法被调用，并传入了正确的参数
    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockInit).toHaveBeenCalledWith(validOptions.containerSelector);

    // 验证记录了成功日志
    expect(mockLogger.log).toHaveBeenCalledWith('AI Assistant Initialized Successfully.');
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  // Test Case 4: 验证参数校验逻辑
  describe('when options are invalid', () => {
    // 使用 .each 来测试多种无效输入，保持代码 DRY
    it.each([[undefined, 'undefined'], [null, 'null'], [{}, 'empty object'], [{containerSelector: '#app'}, 'missing fineReportInstance'], [{fineReportInstance: {}}, 'missing containerSelector'],])('should log an error and return when options are %s', (invalidOptions) => {
      window.initAIAssistant(invalidOptions);

      // 验证记录了错误日志
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith('AI Assistant Initialization Failed: `containerSelector` and `fineReportInstance` must be provided.');

      // 验证核心逻辑未被执行
      expect(mockAppControllerConstructor).not.toHaveBeenCalled();
      expect(mockInit).not.toHaveBeenCalled();
    });
  });

  // Test Case 5: 验证 AppController 实例化时发生错误
  it('should catch errors from AppController instantiation and display a message in the container', () => {
    const instantiationError = new Error('Failed to create AppController');
    mockAppControllerConstructor.mockImplementation(() => {
      throw instantiationError;
    });

    const validOptions = {
      containerSelector: '#error-container', fineReportInstance: {},
    };
    document.body.innerHTML = `<div id="error-container"></div>`;
    const container = document.querySelector(validOptions.containerSelector);

    window.initAIAssistant(validOptions);

    // 验证记录了严重错误
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith('A critical error occurred during initialization:', instantiationError);

    // 验证容器内显示了错误提示信息
    expect(container.innerHTML).toContain('AI 分析助手初始化失败');
    expect(container.innerHTML).toContain('请检查控制台日志或联系技术支持');

    // 验证 init 方法未被调用
    expect(mockInit).not.toHaveBeenCalled();
  });

  // Test Case 6: 验证 app.init() 方法执行时发生错误
  it('should catch errors from app.init() and display a message in the container', () => {
    const initError = new Error('Failed to initialize application');
    mockInit.mockImplementation(() => {
      throw initError;
    });

    const validOptions = {
      containerSelector: '#init-error-container', fineReportInstance: {},
    };
    document.body.innerHTML = `<div id="init-error-container"></div>`;
    const container = document.querySelector(validOptions.containerSelector);

    window.initAIAssistant(validOptions);

    // 验证构造函数仍然被调用了
    expect(mockAppControllerConstructor).toHaveBeenCalledTimes(1);

    // 验证记录了严重错误
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith('A critical error occurred during initialization:', initError);

    // 验证容器内显示了错误提示信息
    expect(container.innerHTML).toContain('AI 分析助手初始化失败');
  });
});
