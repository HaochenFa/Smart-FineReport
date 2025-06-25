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

  beforeEach(() => {
    promptBuilder = new PromptBuilder();
    jest.spyOn(log, 'log').mockImplementation(() => {
    });
    jest.spyOn(log, 'warn').mockImplementation(() => {
    });
    jest.spyOn(log, 'error').mockImplementation(() => {
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should build a complete multi-modal prompt when all data is provided', () => {
    const userRequest = '请分析这张截图。';
    const imageBase64 = 'data:image/png;base64,mock-base64-string';
    const contextProvider = {
      getFormattedHistory: () => [
        {role: 'user', content: '上下文信息'},
        {role: 'ai', content: '好的。'},
      ],
    };

    const resultString = promptBuilder.build(userRequest, imageBase64, contextProvider);
    const resultJson = JSON.parse(resultString);

    expect(() => JSON.parse(resultString)).not.toThrow();


    // System + 历史记录 + 当前用户请求 = 4条消息
    expect(resultJson.messages).toHaveLength(4);

    // 验证System Prompt
    expect(resultJson.messages[0].role).toBe('system');
    expect(resultJson.messages[0].content).toBeDefined();


    // 验证历史记录
    expect(resultJson.messages[1].role).toBe('user');
    expect(resultJson.messages[1].content).toBe('上下文信息');
    expect(resultJson.messages[2].role).toBe('ai');
    expect(resultJson.messages[2].content).toBe('好的。');

    // 验证当前用户请求
    const currentUserMessage = resultJson.messages[3];
    expect(currentUserMessage.role).toBe('user');
    expect(currentUserMessage.content).toHaveLength(2);
    expect(currentUserMessage.content[0].type).toBe('text');
    expect(currentUserMessage.content[0].text).toBe(userRequest);
    expect(currentUserMessage.content[1].type).toBe('image_url');
    expect(currentUserMessage.content[1].image_url.url).toBe(imageBase64);

    expect(log.log).toHaveBeenCalledWith('成功构建多模态Prompt。', expect.any(String));
  });

  it('should handle null contextProvider gracefully', () => {
    const userRequest = '分析图片';
    const imageBase64 = 'data:image/png;base64,another-mock-string';

    const resultString = promptBuilder.build(userRequest, imageBase64, null);
    const resultJson = JSON.parse(resultString);

    // System + user request
    expect(resultJson.messages).toHaveLength(2);
    expect(resultJson.messages[0].role).toBe('system');

    const messageContent = resultJson.messages[1].content[0].text;
    expect(messageContent).toContain(userRequest);
    expect(messageContent).not.toContain('历史对话');
    expect(log.warn).toHaveBeenCalledWith('未提供有效的上下文提供者 (contextProvider)，历史对话将为空。');
  });

  it('should handle invalid imageBase64 string by logging a warning', () => {
    const userRequest = '分析';
    const invalidImageBase64 = 'not-a-base64-string';

    promptBuilder.build(userRequest, invalidImageBase64, null);

    expect(log.warn).toHaveBeenCalledWith('提供的imageBase64字符串无效，可能无法被模型正确解析：', invalidImageBase64);
  });

  it('should return a safe JSON string and log an error if an exception occurs', () => {
    const originalStringify = JSON.stringify;
    JSON.stringify = jest.fn().mockImplementation(() => {
      throw new Error('mock stringify error');
    });

    const result = promptBuilder.build('请求', 'data:image/png;base64,valid', null);

    expect(result).toBe('{}');
    expect(log.error).toHaveBeenCalledWith('构建多模态Prompt时出错：', expect.any(Error));

    JSON.stringify = originalStringify;
  });
});