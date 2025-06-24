/**
 * @file app-controller.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for app-controller.js
 */

import {jest, describe, it, expect, beforeAll, beforeEach} from '@jest/globals';

// --- 模拟所有依赖项 (Mocking all dependencies) ---
const mockSetState = jest.fn();
const mockGetState = jest.fn();
const mockStateManager = jest.fn(() => ({
  setState: mockSetState, getState: mockGetState,
}));

const mockUIManagerInit = jest.fn();
const mockUIManager = jest.fn(() => ({
  init: mockUIManagerInit,
}));

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

const mockHtml2canvas = jest.fn();

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
  Logger: {
    log: mockLoggerLog, error: mockLoggerError,
  }
}));
jest.unstable_mockModule('@/core/context-manager.js', () => ({
  ContextManager: mockContextManager,
}));
jest.unstable_mockModule('html2canvas', () => ({
  default: mockHtml2canvas,
}));


// --- 测试套件 (Test Suite) ---
describe('AppController Orchestration', () => {
  // ** SOLUTION: Step 1 **
  // 声明一个变量来持有 AppController 类，它将在 beforeAll 中被赋值
  let AppController;
  let appControllerInstance;
  const mockSettings = {service: {url: 'http://fake-ai.com'}};
  const mockContainerSelector = '#test-container';

  // ** SOLUTION: Step 2 **
  // 使用 beforeAll 在所有测试开始前，只导入一次被测试的模块。
  // 这确保了所有 mock 都已生效，且避免了模块缓存问题。
  beforeAll(async () => {
    // 动态导入 AppController 以应用模拟
    const module = await import('@/app/app-controller.js');
    AppController = module.default;
  });

  // ** SOLUTION: Step 3 **
  // beforeEach 现在只负责创建新的实例，不再执行导入操作。
  // 这使得设置过程更快、更稳定。
  beforeEach(() => {
    // 每个测试后清理所有模拟，确保测试隔离
    jest.clearAllMocks();
    // 使用已经加载的 AppController 类创建新实例
    appControllerInstance = new AppController(mockSettings);
  });

  // 测试 1: 验证 init 方法的协调逻辑
  describe('init()', () => {
    it('should initialize all dependencies in the correct order and with correct parameters', () => {
      // Act: 调用初始化方法
      appControllerInstance.init(mockContainerSelector);

      // Assert: 验证所有构造函数是否被正确调用
      expect(mockStateManager).toHaveBeenCalledWith({messages: [], isLoading: false});
      expect(mockPromptBuilder).toHaveBeenCalledTimes(1);
      expect(mockAIEngine).toHaveBeenCalledWith(mockSettings.service);
      expect(mockContextManager).toHaveBeenCalledTimes(1);
      expect(mockAnalysisPipeline).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
      expect(mockUIManager).toHaveBeenCalledWith(mockContainerSelector, expect.any(Object), expect.any(Function));
      expect(mockUIManagerInit).toHaveBeenCalledTimes(1);
      expect(mockLoggerLog).toHaveBeenCalledWith("AppController Initialized and Ready");
    });
  });

  // 测试 2: 验证 handleUserQuery 的协调逻辑
  describe('handleUserQuery()', () => {
    beforeEach(() => {
      // Mock the report container element
      document.body.innerHTML = `<div class="report-container">Report Content</div>`;
      appControllerInstance.init(mockContainerSelector);
    });

    it('should not process an empty or whitespace-only query', async () => {
      await appControllerInstance.handleUserQuery('');
      await appControllerInstance.handleUserQuery('   ');

      expect(mockSetState).not.toHaveBeenCalled();
      expect(mockPipelineRun).not.toHaveBeenCalled();
    });

    it('should handle a successful query flow correctly', async () => {
      // Arrange
      const userQuery = 'Hello AI';
      const aiResponse = 'Hello User';
      const initialMessages = [{role: 'assistant', content: 'Welcome!'}];
      const history = 'formatted_history';
      const mockCanvas = { toDataURL: () => 'data:image/png;base64,mock-base64-string' };

      mockGetState
        .mockReturnValueOnce({messages: initialMessages})
        .mockReturnValueOnce({messages: [...initialMessages, {role: 'user', content: userQuery}]});

      mockGetFormattedHistory.mockReturnValue(history);
      mockHtml2canvas.mockResolvedValue(mockCanvas);
      mockPipelineRun.mockResolvedValue(aiResponse);

      // Act
      await appControllerInstance.handleUserQuery(userQuery);

      // Assert
      expect(mockHtml2canvas).toHaveBeenCalledWith(document.querySelector('.report-container'));
      expect(mockSetState).toHaveBeenCalledTimes(3);
      expect(mockSetState).toHaveBeenCalledWith({
        messages: [...initialMessages, {role: 'user', content: userQuery}], isLoading: true,
      });
      expect(mockSetState).toHaveBeenCalledWith({
        messages: [...initialMessages, {role: 'user', content: userQuery}, {role: 'assistant', content: aiResponse}],
      });
      expect(mockSetState).toHaveBeenCalledWith({isLoading: false});
      expect(mockAddMessage).toHaveBeenCalledWith('user', userQuery);
      expect(mockAddMessage).toHaveBeenCalledWith('assistant', aiResponse);
      expect(mockPipelineRun).toHaveBeenCalledWith(userQuery, 'data:image/png;base64,mock-base64-string', history);
    });

    it('should handle an error from the analysis pipeline', async () => {
      // Arrange
      const userQuery = 'This will fail';
      const errorMessage = '抱歉，分析时遇到问题，请稍后重试。';
      const error = new Error('Pipeline Failure');
      const initialMessages = [];

      mockGetState
        .mockReturnValueOnce({messages: initialMessages})
        .mockReturnValueOnce({messages: [...initialMessages, {role: 'user', content: userQuery}]});

      mockPipelineRun.mockRejectedValue(error);

      // Act
      await appControllerInstance.handleUserQuery(userQuery);

      // Assert
      expect(mockLoggerError).toHaveBeenCalledWith("Error occurred while handling user query:", error);
      expect(mockSetState).toHaveBeenCalledTimes(3);
      expect(mockSetState).toHaveBeenCalledWith(expect.objectContaining({isLoading: true}));
      expect(mockSetState).toHaveBeenCalledWith({
        messages: [...initialMessages, {role: 'user', content: userQuery}, {role: 'assistant', content: errorMessage}],
      });
      expect(mockSetState).toHaveBeenCalledWith({isLoading: false});
      expect(mockAddMessage).toHaveBeenCalledTimes(1);
      expect(mockAddMessage).toHaveBeenCalledWith('user', userQuery);
      expect(mockAddMessage).not.toHaveBeenCalledWith('assistant', expect.any(String));
    });
  });
});
