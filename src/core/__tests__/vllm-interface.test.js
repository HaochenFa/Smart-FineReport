/**
 * @file vllm-interface.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for src/core/vllm-interface.js
 */

import {beforeEach, describe, expect, it, jest} from "@jest/globals";

// Module-level variables to hold the imported modules after mocking.
// 模块级变量，用于在模拟后持有导入的模块。
let AIEngine;
let APIService;
let Logger;

// ESM-compatible mocking setup. This runs once before all tests in this file.
// 兼容ESM的模拟设置。此代码块在本文件所有测试运行前执行一次。
beforeAll(async () => {
  // 1. Mock the dependencies using Jest's API for ES Modules.
  //    使用Jest的ESM API来模拟依赖项。
  jest.unstable_mockModule("@/services/api-service.js", () => ({
    APIService: {
      post: jest.fn(),
    },
  }));

  jest.unstable_mockModule("@/utils/logger.js", () => ({
    Logger: {
      log: jest.fn(),
      error: jest.fn(),
    },
  }));

  // 2. Dynamically import the modules *after* the mocks have been configured.
  //    在模拟配置完成*之后*，动态导入模块。
  const vllmInterfaceModule = await import("@//core/vllm-interface.js");
  AIEngine = vllmInterfaceModule.AIEngine;

  const apiServiceModule = await import("@/services/api-service.js");
  APIService = apiServiceModule.APIService;

  const loggerModule = await import("@/utils/logger.js");
  Logger = loggerModule.Logger;
});


// --- Test Suite --- //
describe('AIEngine', () => {
  const MOCK_URL = 'http://fake-vllm-server.com/generate';
  const MOCK_API_KEY = 'test-api-key-123';

  // Before each test, clear all mock history to ensure a clean state.
  // 在每次测试前清除所有模拟历史，以确保一个纯净的测试环境。
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Constructor Tests --- //
  describe('Constructor', () => {
    it('should throw an error if config.url is not provided', () => {
      const errorMsg = "AIEngine Error: Configuration object must contain a 'url'.";
      expect(() => new AIEngine({apiKey: 'some-key'})).toThrow(errorMsg);
      expect(Logger.error).toHaveBeenCalledWith(errorMsg);
    });

    it('should initialize correctly with a URL and no API key', () => {
      const engine = new AIEngine({url: MOCK_URL});
      expect(engine.url).toBe(MOCK_URL);
      expect(engine.apiKey).toBeUndefined();
      expect(Logger.log).toHaveBeenCalledWith(`[AIEngine] Initialized with URL: ${MOCK_URL}`);
    });

    it('should initialize correctly with both URL and API key', () => {
      const engine = new AIEngine({url: MOCK_URL, apiKey: MOCK_API_KEY});
      expect(engine.url).toBe(MOCK_URL);
      expect(engine.apiKey).toBe(MOCK_API_KEY);
    });
  });

  // --- getResponse Method Tests --- //
  describe('getResponse', () => {
    // Input Validation
    it('should throw an error for a null, empty, or whitespace-only prompt', async () => {
      const engine = new AIEngine({url: MOCK_URL});
      const errorMsg = "[AIEngine] Error: Prompt cannot be null, empty, or invalid.";

      await expect(engine.getResponse(null)).rejects.toThrow(errorMsg);
      await expect(engine.getResponse('')).rejects.toThrow(errorMsg);
      await expect(engine.getResponse('   ')).rejects.toThrow(errorMsg);
      expect(Logger.error).toHaveBeenCalledWith(errorMsg);
    });

    // Successful API Call & Response Parsing
    it('should call APIService.post with correct arguments and return trimmed text', async () => {
      const engine = new AIEngine({url: MOCK_URL, apiKey: MOCK_API_KEY});
      const prompt = 'Hello, AI!';
      const mockApiResponse = {
        choices: [{text: '  Hello from the AI!  '}],
      };

      // Arrange: Set up the mock return value for the API call.
      APIService.post.mockResolvedValue(mockApiResponse);

      // Act: Call the method under test.
      const result = await engine.getResponse(prompt);

      // Assert: Verify the interaction and the result.
      expect(APIService.post).toHaveBeenCalledTimes(1);
      expect(APIService.post).toHaveBeenCalledWith(
        MOCK_URL,
        expect.objectContaining({prompt}), // Check that the prompt is in the body
        {'Authorization': `Bearer ${MOCK_API_KEY}`} // Check for the auth header
      );
      expect(result).toBe('Hello from the AI!');
      expect(Logger.log).toHaveBeenCalledWith('[AIEngine] Successfully processed response text.');
    });

    // API Error Response Handling
    it.each([
      ['response is null', null],
      ['response has no "choices" property', {id: '123'}],
      ['"choices" property is not an array', {choices: 'not-an-array'}],
      ['"choices" array is empty', {choices: []}],
      ['first choice has no "text" property', {choices: [{index: 0}]}],
    ])('should throw an error if the API %s', async (scenario, invalidResponse) => {
      const engine = new AIEngine({url: MOCK_URL});
      APIService.post.mockResolvedValue(invalidResponse);

      const errorMsg = "[AIEngine] Error: Invalid or unexpected response structure from API.";
      await expect(engine.getResponse('any prompt')).rejects.toThrow(errorMsg);
      expect(Logger.error).toHaveBeenCalledWith(errorMsg, invalidResponse);
    });

    // Error Propagation from APIService
    it('should re-throw errors that occur within APIService.post', async () => {
      const engine = new AIEngine({url: MOCK_URL});
      const networkError = new Error('Network Failure');

      // Arrange: Configure the mock to reject.
      APIService.post.mockRejectedValue(networkError);

      // Act & Assert: Ensure the error is re-thrown.
      await expect(engine.getResponse('any prompt')).rejects.toThrow(networkError);
      expect(Logger.error).toHaveBeenCalledWith('[AIEngine] An error occurred during the getResponse process.');
    });
  });
});