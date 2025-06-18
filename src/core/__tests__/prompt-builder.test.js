/**
 * @file prompt-builder.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for src/core/prompt-builder.js
 */

import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";

import {PromptBuilder} from '@/core/prompt-builder.js';
import {Logger as log} from '@/utils/logger.js';

describe('PromptBuilder', () => {
  let promptBuilder;

  // Before each test, create a new instance and set up spies on the logger.
  // 在每次测试前，创建一个新的 PromptBuilder 实例并为 logger 设置间谍。
  beforeEach(() => {
    promptBuilder = new PromptBuilder();
    // Spy on logger methods to prevent console output and track calls.
    // This is the recommended approach for ESM.
    jest.spyOn(log, 'log').mockImplementation(() => {
    });
    jest.spyOn(log, 'warn').mockImplementation(() => {
    });
    jest.spyOn(log, 'error').mockImplementation(() => {
    });
  });

  // After each test, restore original method implementations to avoid side effects.
  // 在每次测试后，恢复原始方法实现以避免副作用。
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test Case 1: Happy path with all data provided.
  // 测试用例 1: 提供所有数据的理想情况。
  it('should build a complete prompt string when all data is provided correctly', () => {
    const userRequest = '请分析本月的销售数据。';
    const structuredData = {
      Table: [{'Region': 'North', 'Sales': 100}],
      Chart: {'Type': 'Bar', 'Data': [100, 200]},
      CrossTable: 'some_cross_table_data',
      DashBoard: 'some_dashboard_data',
      Map: 'some_map_data',
    };
    const contextProvider = {
      getFormattedHistory: () => 'User: 之前的销售额是多少？\nAI: 5000元。',
    };

    const resultString = promptBuilder.build(userRequest, structuredData, contextProvider);
    const resultJson = JSON.parse(resultString);

    // Assert that the output is a valid JSON string
    expect(() => JSON.parse(resultString)).not.toThrow();

    // Assertions for each field
    expect(resultJson.User).toBe(userRequest);
    expect(resultJson.Context).toBe(contextProvider.getFormattedHistory());
    expect(resultJson.Data.Table).toEqual(structuredData.Table);
    expect(resultJson.Data.Chart).toEqual(structuredData.Chart);
    expect(resultJson.Data.CrossTable).toBe(structuredData.CrossTable);
    expect(resultJson.Data.DashBoard).toBe(structuredData.DashBoard);
    expect(resultJson.Data.Map).toBe(structuredData.Map);
    expect(typeof resultJson.Header.TimeStamp).toBe('string');
    expect(new Date(resultJson.Header.TimeStamp).toString()).not.toBe('Invalid Date');

    // Assert that logging functions were called as expected
    expect(log.log).toHaveBeenCalled();
    expect(log.warn).not.toHaveBeenCalled();
    expect(log.error).not.toHaveBeenCalled();
  });

  // Test Case 2: Structured data with missing keys and extra keys.
  // 测试用例 2: 结构化数据包含缺失和额外的键。
  it('should handle partially matched structured data and append unmatched data to DashBoard', () => {
    const userRequest = '分析数据';
    const structuredData = {
      table: '这是表格数据。', // Case-insensitive key
      ExtraData: '这是额外的数据。', // Unmatched key
    };

    const resultString = promptBuilder.build(userRequest, structuredData, null);
    const resultJson = JSON.parse(resultString);

    // Assert that matched data is filled and unmatched template fields are empty
    expect(resultJson.Data.Table).toBe('这是表格数据。');
    expect(resultJson.Data.Chart).toBe('');
    expect(resultJson.Data.CrossTable).toBe('');

    // Assert that unmatched data is appended to DashBoard
    const expectedFallback = JSON.stringify({uncategorizedData: {ExtraData: '这是额外的数据。'}}, null, 2);
    expect(resultJson.Data.DashBoard).toContain('// --- 额外的未分类数据 ---');
    expect(resultJson.Data.DashBoard).toContain(expectedFallback);

    // Assert that a warning was logged for unmatched keys
    expect(log.warn).toHaveBeenCalledWith("发现未匹配的数据键，将作为备用数据追加到DashBoard中：", ["ExtraData"]);
  });

  // Test Case 3: No context provider.
  // 测试用例 3: 未提供上下文提供者。
  it('should set Context to an empty string and log a warning if contextProvider is invalid', () => {
    const userRequest = '你好';

    // Test with null provider
    promptBuilder.build(userRequest, {}, null);
    // Test with provider missing the required method
    promptBuilder.build(userRequest, {}, {
      someOtherMethod: () => {
      }
    });

    // Assert that a warning was logged twice
    expect(log.warn).toHaveBeenCalledWith("未提供有效的上下文提供者 (contextProvider)，上下文将为空。");
    expect(log.warn).toHaveBeenCalledTimes(2);
  });

  // Test Case 4: No structured data.
  // 测试用例 4: 未提供结构化数据。
  it('should set all Data fields to empty strings and log a warning if structuredData is null', () => {
    const resultString = promptBuilder.build('请求', null, null);
    const resultJson = JSON.parse(resultString);

    Object.values(resultJson.Data).forEach(value => {
      expect(value).toBe('');
    });

    // Assert that a warning was logged
    expect(log.warn).toHaveBeenCalledWith("structuredData不是一个有效的对象，所有数据字段将为空。", null);
  });

  // Test Case 5: Structured data is not an object.
  // 测试用例 5: 结构化数据不是一个对象。
  it('should handle non-object structuredData gracefully', () => {
    const resultString = promptBuilder.build('请求', 'a string, not an object', null);
    const resultJson = JSON.parse(resultString);

    Object.values(resultJson.Data).forEach(value => {
      expect(value).toBe('');
    });

    // Assert that a warning was logged
    expect(log.warn).toHaveBeenCalledWith("structuredData不是一个有效的对象，所有数据字段将为空。", 'a string, not an object');
  });

  // Test Case 6: Case-insensitive key matching for structured data.
  // 测试用例 6: 结构化数据键的大小写不敏感匹配。
  it('should match structured data keys case-insensitively', () => {
    const structuredData = {
      'table': 'table_data',
      'CHART': 'chart_data',
      'crosstable': 'cross_table_data',
      'DASHBOARD': 'dashboard_data',
      'mAp': 'map_data',
    };

    const resultString = promptBuilder.build('请求', structuredData, null);
    const resultJson = JSON.parse(resultString);

    expect(resultJson.Data.Table).toBe('table_data');
    expect(resultJson.Data.Chart).toBe('chart_data');
    expect(resultJson.Data.CrossTable).toBe('cross_table_data');
    expect(resultJson.Data.DashBoard).toBe('dashboard_data');
    expect(resultJson.Data.Map).toBe('map_data');
    expect(log.warn).not.toHaveBeenCalledWith(expect.stringContaining('发现未匹配的数据键'));
  });

  // Test Case 7: Error handling during prompt building.
  // 测试用例 7: Prompt 构建过程中的错误处理。
  it('should return an empty JSON object string and log an error if an exception occurs', () => {
    // Force an error by mocking a global function
    const originalStringify = JSON.stringify;
    JSON.stringify = jest.fn().mockImplementation(() => {
      throw new Error("mock stringify error");
    });

    const result = promptBuilder.build('请求', {}, null);

    // Assert that it returns a safe fallback and logs the error
    expect(result).toBe('{}');
    expect(log.error).toHaveBeenCalledWith("构建Prompt字符串时出错：", expect.any(Error));

    // Restore original function
    JSON.stringify = originalStringify;
  });
});