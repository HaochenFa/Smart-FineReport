/**
 * @file api-service.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for src/services/api-service.js
 */

import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";
import {APIService} from '@/services/api-service.js';
import {Logger} from '@/utils/logger.js';

let logErrSpy;

describe('APIService.post', () => {
  const TEST_URL = 'https://api.example.com/data';
  const TEST_BODY = {key: 'value'};
  const TEST_HEADERS = {'X-Custom-Header': 'CustomValue'};

  // Before each test, we mock the global fetch function.
  // This is crucial for isolating our tests from the network.
  // 在每次测试前，我们都模拟全局 fetch 函数。
  // 这对于将测试与网络隔离开来至关重要。
  beforeEach(() => {
    global.fetch = jest.fn();

    // Set up the spy on Logger.error.
    // .mockImplementation(() => {}) prevents actual console output.
    // 建立对 Logger.error 的监视。
    // .mockImplementation(() => {}) 会阻止真实的控制台输出。
    logErrSpy = jest.spyOn(Logger, 'error').mockImplementation(() => {
    });
  });

  // After each test, clear all mocks to ensure test isolation.
  // 每次测试后，清除所有模拟，以确保测试的独立性。
  afterEach(() => {
    logErrSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('should make a POST request and return parsed JSON on success', async () => {
    // Arrange: Set up the mock successful response.
    // 准备阶段：设置模拟的成功响应。
    const mockSuccessResponse = {data: 'success'};
    const mockFetchResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockSuccessResponse),
    };
    global.fetch.mockResolvedValue(mockFetchResponse);

    // Act: Call the method under test.
    // 执行阶段：调用被测方法。
    const result = await APIService.post(TEST_URL, TEST_BODY, TEST_HEADERS);

    // Assert: Verify the behavior and outcome.
    // 断言阶段：验证行为和结果。
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(TEST_URL, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...TEST_HEADERS,
      }),
      body: JSON.stringify(TEST_BODY),
    });
    expect(result).toEqual(mockSuccessResponse);
    expect(logErrSpy).not.toHaveBeenCalled();
  });

  it('should throw a detailed error on HTTP failure (response.ok is false)', async () => {
    // Arrange: Set up the mock error response with a JSON body.
    // 准备阶段：设置一个带有 JSON 体的模拟错误响应。
    const mockErrorBody = {message: 'Resource not found'};
    const mockFetchResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      url: TEST_URL,
      json: jest.fn().mockResolvedValue(mockErrorBody),
    };
    global.fetch.mockResolvedValue(mockFetchResponse);

    // Act & Assert: Expect the method to throw an error and verify its properties.
    // 执行与断言：期望方法抛出错误，并验证错误的属性。
    await expect(APIService.post(TEST_URL, TEST_BODY)).rejects.toThrow(
      'HTTP error: 404. Details: {"status":404,"statusText":"Not Found","url":"https://api.example.com/data","body":{"message":"Resource not found"}}'
    );

    expect(logErrSpy).toHaveBeenCalledTimes(1);
    expect(logErrSpy).toHaveBeenCalledWith(
      'APIService POST Error:',
      expect.stringContaining('HTTP error: 404')
    );
  });

  it('should handle HTTP failure when error response body is not JSON', async () => {
    // Arrange: Set up a mock error response with a non-JSON body.
    // 准备阶段：设置一个响应体不是 JSON 的模拟错误响应。
    const mockFetchResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      url: TEST_URL,
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')), // Simulate parsing failure
    };
    global.fetch.mockResolvedValue(mockFetchResponse);

    // Act & Assert: Verify the thrown error contains the correct fallback message.
    // 执行与断言：验证抛出的错误包含正确的备用信息。
    await expect(APIService.post(TEST_URL, TEST_BODY)).rejects.toThrow(
      'HTTP error: 500. Details: {"status":500,"statusText":"Internal Server Error","url":"https://api.example.com/data","body":"Could not parse error response body as JSON."}'
    );
    expect(logErrSpy).toHaveBeenCalledTimes(1);
  });

  it('should throw an error and log on network failure', async () => {
    // Arrange: Mock fetch to reject, simulating a network error.
    // 准备阶段：模拟 fetch 的 reject，以模拟网络错误。
    const networkError = new Error('Network request failed');
    global.fetch.mockRejectedValue(networkError);

    // Act & Assert: Expect the promise to be rejected with the network error.
    // 执行与断言：期望 Promise 因网络错误而被拒绝。
    await expect(APIService.post(TEST_URL, TEST_BODY)).rejects.toThrow('Network request failed');

    expect(logErrSpy).toHaveBeenCalledTimes(1);
    expect(logErrSpy).toHaveBeenCalledWith('APIService POST Error:', 'Network request failed');
  });
});