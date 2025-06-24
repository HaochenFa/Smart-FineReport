/**
 * @file vllm-interface.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for src/core/vllm-interface.js
 */

import {beforeAll, beforeEach, describe, expect, it, jest} from "@jest/globals";

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
    const validMultiModalPrompt = JSON.stringify({
      model: 'llava-hf/llava-1.5-7b-hf',
      messages: [{
        role: 'user',
        content: [
          {type: 'text', text: 'Analyze this image.'},
          {type: 'image_url', image_url: {url: 'data:image/png;base64,mock-base64'}}
        ]
      }]
    });

    it('should throw an error for an invalid JSON prompt', async () => {
      const engine = new AIEngine({url: MOCK_URL});
      const errorMsg = "[AIEngine] Error: Prompt is not a valid JSON string.";
      await expect(engine.getResponse('not a json')).rejects.toThrow(errorMsg);
      expect(Logger.error).toHaveBeenCalledWith(errorMsg, expect.any(Error));
    });

    it('should call APIService.post with the parsed JSON body and return trimmed message content', async () => {
      const engine = new AIEngine({url: MOCK_URL, apiKey: MOCK_API_KEY});
      const mockApiResponse = {
        choices: [{message: {content: '  AI analysis result.  '}}],
      };

      APIService.post.mockResolvedValue(mockApiResponse);

      const result = await engine.getResponse(validMultiModalPrompt);

      expect(APIService.post).toHaveBeenCalledTimes(1);
      expect(APIService.post).toHaveBeenCalledWith(
        MOCK_URL,
        JSON.parse(validMultiModalPrompt), // Body should be the parsed JSON object
        {'Authorization': `Bearer ${MOCK_API_KEY}`} // Auth header
      );
      expect(result).toBe('AI analysis result.');
      expect(Logger.log).toHaveBeenCalledWith('[AIEngine] Successfully processed response message.');
    });

    it.each([
      ['response is null', null],
      ['response has no "choices" property', {id: '123'}],
      ['"choices" is not an array', {choices: 'not-an-array'}],
      ['"choices" array is empty', {choices: []}],
      ['first choice has no "message" property', {choices: [{index: 0}]}],
      ['message has no "content" property', {choices: [{message: {role: 'assistant'}}]}]
    ])('should throw an error if the API %s', async (scenario, invalidResponse) => {
      const engine = new AIEngine({url: MOCK_URL});
      APIService.post.mockResolvedValue(invalidResponse);

      const errorMsg = "[AIEngine] Error: Invalid or unexpected response structure from ChatCompletion API.";
      await expect(engine.getResponse(validMultiModalPrompt)).rejects.toThrow(errorMsg);
      expect(Logger.error).toHaveBeenCalledWith(errorMsg, invalidResponse);
    });

    it('should re-throw errors from APIService.post', async () => {
      const engine = new AIEngine({url: MOCK_URL});
      const networkError = new Error('Network Failure');
      APIService.post.mockRejectedValue(networkError);

      await expect(engine.getResponse(validMultiModalPrompt)).rejects.toThrow(networkError);
      expect(Logger.error).toHaveBeenCalledWith('[AIEngine] An error occurred during the getResponse process.');
    });
  });
});