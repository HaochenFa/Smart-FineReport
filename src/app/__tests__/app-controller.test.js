/**
 * @file app-controller.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for app-controller.js
 */

import {jest, describe, it, expect, beforeEach, afterEach} from '@jest/globals';

// --- 模拟所有依赖项 (Mocking all dependencies) ---
// 为每个模块创建模拟构造函数和方法
const mockSetState = jest.fn();
const mockGetState = jest.fn();
const mockStateManager = jest.fn(() => ({
  setState: mockSetState, getState: mockGetState,
}));

const mockUIManagerInit = jest.fn();
const mockUIManager = jest.fn(() => ({
  init: mockUIManagerInit,
}));

const mockFRInterface = jest.fn();
const mockDataProcessor = jest.fn();
const mockPromptBuilder = jest.fn();
const mockAIEngine = jest.fn();

const mockAddMessage = jest.fn();
const mockGetFormattedHistory = jest.fn();
const mockContextManager = jest.fn(() => ({
  addMessage: mockAddMessage, getFormattedHistory: mockGetFormattedHistory,
}));

const mockPipelineRun = jest.fn();
const mockAnalysisPipeline = jest.fn(() => ({
  run: mockPipelineRun,
}));

const mockLoggerLog = jest.spyOn(console, 'log').mockImplementation(() => {
});
const mockLoggerError = jest.spyOn(console, 'error').mockImplementation(() => {
});

// 使用 jest.unstable_mockModule 进行 ESM 模块模拟
jest.unstable_mockModule('@/app/state-manager.js', () => ({
  StateManager: mockStateManager,
}));
jest.unstable_mockModule('@/ui/ui-manager.js', () => ({
  UIManager: mockUIManager,
}));
jest.unstable_mockModule('@/integration/fr-interface.js', () => ({
  FRInterface: mockFRInterface,
}));
jest.unstable_mockModule('@/integration/data-processor.js', () => ({
  DataProcessor: mockDataProcessor,
}));
jest.unstable_mockModule('@/core/prompt-builder.js', () => ({
  PromptBuilder: mockPromptBuilder,
}));
jest.unstable_mockModule('@/core/vllm-interface.js', () => ({
  AIEngine: mockAIEngine,
}));
jest.unstable_mockModule('@/core/ai-analysis-pipeline.js', () => ({
  AnalysisPipeline: mockAnalysisPipeline,
}));
jest.unstable_mockModule('@/utils/logger.js', () => ({
  Logger: { // 模拟 Logger 的静态方法
    log: mockLoggerLog, error: mockLoggerError,
  }
}));
jest.unstable_mockModule('@/core/context-manager.js', () => ({
  ContextManager: mockContextManager,
}));


// --- 测试套件 (Test Suite) ---
describe('AppController Orchestration', () => {
  let AppController;
  const mockSettings = {service: {url: 'http://fake-ai.com'}};
  const mockContainerSelector = '#test-container';
  const mockFrInstance = {fake: 'fr-instance'};

  // 在每个测试前，动态导入被测模块
  // 必须在设置 mock 之后进行
  beforeEach(async () => {
    // 动态导入 AppController 以应用模拟
    const module = await import('@/app/app-controller.js');
    AppController = module.default; // AppController 是单例`
    AppController.settings = mockSettings; // 重新注入设置
  });

  // 每个测试后清理所有模拟，确保测试隔离
  afterEach(() => {
    jest.clearAllMocks();
  });

  // 测试 1: 验证 init 方法的协调逻辑
  describe('init()', () => {
    it('should initialize all dependencies in the correct order and with correct parameters', () => {
      // Act: 调用初始化方法
      AppController.init(mockContainerSelector, mockFrInstance);

      // Assert: 验证所有构造函数是否被正确调用
      expect(mockStateManager).toHaveBeenCalledWith({messages: [], isLoading: false});
      expect(mockFRInterface).toHaveBeenCalledWith(mockFrInstance);
      expect(mockDataProcessor).toHaveBeenCalledWith(expect.any(Object)); // 传入了 frInterface 实例
      expect(mockPromptBuilder).toHaveBeenCalledTimes(1);
      expect(mockAIEngine).toHaveBeenCalledWith(mockSettings.service);
      expect(mockContextManager).toHaveBeenCalledTimes(1);

      // 验证 AnalysisPipeline 的构造
      expect(mockAnalysisPipeline).toHaveBeenCalledWith(expect.any(Object), // dataProcessor instance
        expect.any(Object), // promptBuilder instance
        expect.any(Object)  // aiEngine instance
      );

      // 验证 UIManager 的构造
      expect(mockUIManager).toHaveBeenCalledWith(mockContainerSelector, expect.any(Object), // stateManager instance
        expect.any(Function) // handleUserQuery bound function
      );

      // 验证 UI 是否启动
      expect(mockUIManagerInit).toHaveBeenCalledTimes(1);

      // 验证日志
      expect(mockLoggerLog).toHaveBeenCalledWith("AppController Initialized and Ready");
    });
  });

  // 测试 2: 验证 handleUserQuery 的协调逻辑
  describe('handleUserQuery()', () => {
    // 先初始化 Controller
    beforeEach(() => {
      AppController.init(mockContainerSelector, mockFrInstance);
    });

    it('should not process an empty or whitespace-only query', async () => {
      await AppController.handleUserQuery('');
      await AppController.handleUserQuery('   ');

      expect(mockSetState).not.toHaveBeenCalled();
      expect(mockPipelineRun).not.toHaveBeenCalled();
    });

    it('should handle a successful query flow correctly', async () => {
      // Arrange: 准备模拟的返回值
      const userQuery = 'Hello AI';
      const aiResponse = 'Hello User';
      const initialMessages = [{role: 'assistant', content: 'Welcome!'}];
      const history = 'formatted_history';

      mockGetState
        .mockReturnValueOnce({messages: initialMessages}) // 第一次调用，用于添加用户消息
        .mockReturnValueOnce({messages: [...initialMessages, {role: 'user', content: userQuery}]}); // 第二次调用，用于添加 AI 消息

      mockGetFormattedHistory.mockReturnValue(history);
      mockPipelineRun.mockResolvedValue(aiResponse);

      // 在 JSDOM 中模拟全局 window.FR
      global.window.FR = mockFrInstance;

      // Act: 执行用户查询处理
      await AppController.handleUserQuery(userQuery);

      // Assert: 验证流程
      // 1. 验证状态更新
      expect(mockSetState).toHaveBeenCalledTimes(3);
      // 第一次调用：添加用户消息并设置 loading
      expect(mockSetState).toHaveBeenCalledWith({
        messages: [...initialMessages, {role: 'user', content: userQuery}], isLoading: true,
      });
      // 第二次调用：添加 AI 消息
      expect(mockSetState).toHaveBeenCalledWith({
        messages: [...initialMessages, {role: 'user', content: userQuery}, {role: 'assistant', content: aiResponse}],
      });
      // 第三次调用（finally块）：取消 loading
      expect(mockSetState).toHaveBeenCalledWith({isLoading: false});

      // 2. 验证上下文管理
      expect(mockAddMessage).toHaveBeenCalledWith('user', userQuery);
      expect(mockAddMessage).toHaveBeenCalledWith('assistant', aiResponse);

      // 3. 验证分析管线调用
      expect(mockPipelineRun).toHaveBeenCalledWith(userQuery, mockFrInstance, history);
    });

    it('should handle an error from the analysis pipeline', async () => {
      // Arrange: 准备模拟的错误
      const userQuery = 'This will fail';
      const errorMessage = '抱歉，分析时遇到问题，请稍后重试。';
      const error = new Error('Pipeline Failure');
      const initialMessages = [];

      mockGetState
        .mockReturnValueOnce({messages: initialMessages}) // for adding user message
        .mockReturnValueOnce({messages: [...initialMessages, {role: 'user', content: userQuery}]}); // for adding error message

      mockPipelineRun.mockRejectedValue(error);

      // Act: 执行查询
      await AppController.handleUserQuery(userQuery);

      // Assert:
      // 1. 验证错误日志
      expect(mockLoggerError).toHaveBeenCalledWith("Error occurred while handling user query:", error);

      // 2. 验证状态更新
      expect(mockSetState).toHaveBeenCalledTimes(3);
      // 检查是否设置了 loading
      expect(mockSetState).toHaveBeenCalledWith(expect.objectContaining({isLoading: true}));
      // 检查是否添加了错误消息
      expect(mockSetState).toHaveBeenCalledWith({
        messages: [...initialMessages, {role: 'user', content: userQuery}, {role: 'assistant', content: errorMessage}],
      });
      // 检查是否取消了 loading
      expect(mockSetState).toHaveBeenCalledWith({isLoading: false});

      // 3. 确保 AI 响应没有被错误地添加到上下文中
      expect(mockAddMessage).toHaveBeenCalledTimes(1);
      expect(mockAddMessage).toHaveBeenCalledWith('user', userQuery);
      expect(mockAddMessage).not.toHaveBeenCalledWith('assistant', expect.any(String));
    });
  });
});