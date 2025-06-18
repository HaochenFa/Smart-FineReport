/**
 * @file context-manager.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for src/core/context-manager.js
 */

import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";

import {ContextManager} from '@/core/context-manager.js';
// import {Logger as log} from '@/utils/logger.js';

/**
 * @describe Test suite for the ContextManager class.
 */
describe('ContextManager', () => {
  let contextManager;
  let logSpy;
  let errorSpy;

  // 在每个测试用例运行前执行
  beforeEach(() => {
    // 使用 jest.spyOn 监视 console 的方法。
    // 这允许我们检查日志是否被调用，同时避免了 ESM 的 mock 问题。
    // .mockImplementation(() => {}) 会压制原始的控制台输出，保持测试报告的整洁。
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {
    });
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
    });
  });

  // 在每个测试用例运行后执行，恢复原始的 console 功能，避免测试间的干扰。
  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  // 1. Constructor Tests
  describe('Constructor', () => {
    it('should initialize with a default maxMessages of 10', () => {
      // Arrange & Act
      contextManager = new ContextManager();

      // Assert: 通过添加超过限制的消息来间接验证 maxMessages
      for (let i = 1; i <= 11; i++) {
        contextManager.addMessage('user', `message ${i}`);
      }
      const history = contextManager.getFormattedHistory();
      const messages = history.split('\n');

      expect(messages.length).toBe(10);
      expect(messages[0]).toBe('user: message 2'); // The oldest message 'message 1' should be removed.
    });

    it('should initialize with a custom maxMessages value', () => {
      // Arrange & Act
      const customMax = 5;
      contextManager = new ContextManager(customMax);

      // Assert: 通过添加超过限制的消息来验证自定义的 maxMessages
      for (let i = 1; i <= 6; i++) {
        contextManager.addMessage('user', `msg ${i}`);
      }
      const history = contextManager.getFormattedHistory();
      const messages = history.split('\n');

      expect(messages.length).toBe(5);
      expect(messages[0]).toBe('user: msg 2'); // 'msg 1' should be removed.
    });
  });

  // 2. addMessage Tests
  describe('addMessage', () => {
    beforeEach(() => {
      contextManager = new ContextManager(3); // Use a small limit for easier testing.
    });

    it('should add a single message correctly', () => {
      // Arrange
      const role = 'user';
      const content = 'Hello, world!';

      // Act
      contextManager.addMessage(role, content);

      // Assert
      const expectedHistory = 'user: Hello, world!';
      expect(contextManager.getFormattedHistory()).toBe(expectedHistory);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Message added: { role: 'user' }"));
    });

    it('should not add a message and log an error if arguments are invalid', () => {
      // Arrange
      const initialHistory = contextManager.getFormattedHistory();

      // Act & Assert for various invalid inputs
      contextManager.addMessage('', 'some content');
      expect(contextManager.getFormattedHistory()).toBe(initialHistory);
      expect(errorSpy).toHaveBeenCalledWith("[ContextManager] Invalid arguments. 'role' and 'content' must be non-empty strings.");

      contextManager.addMessage('user', '   '); // Content with only whitespace
      expect(contextManager.getFormattedHistory()).toBe(initialHistory);

      contextManager.addMessage(null, 'some content');
      expect(contextManager.getFormattedHistory()).toBe(initialHistory);

      // Verify that the error was logged for each invalid call.
      expect(errorSpy).toHaveBeenCalledTimes(3);
    });

    it('should remove the oldest message when history exceeds maxMessages', () => {
      // Arrange
      contextManager.addMessage('user', 'message 1'); // This one will be removed.
      contextManager.addMessage('assistant', 'message 2');
      contextManager.addMessage('user', 'message 3');

      // Act
      // Adding the 4th message should push out the oldest one ('message 1').
      contextManager.addMessage('assistant', 'message 4');

      // Assert
      const history = contextManager.getFormattedHistory();
      const messages = history.split('\n');

      expect(messages.length).toBe(3);
      expect(history).not.toContain('message 1');
      expect(messages[0]).toBe('assistant: message 2');
      expect(messages[2]).toBe('assistant: message 4');
      expect(logSpy).toHaveBeenCalledWith("[ContextManager] History exceeded max size. Oldest message removed.");
    });
  });

  // 3. getFormattedHistory Tests
  describe('getFormattedHistory', () => {
    it('should return an empty string for an empty history', () => {
      // Arrange
      contextManager = new ContextManager();
      // Act & Assert
      expect(contextManager.getFormattedHistory()).toBe('');
    });

    it('should return a correctly formatted string for a non-empty history', () => {
      // Arrange
      contextManager = new ContextManager();
      contextManager.addMessage('user', 'Hello');
      contextManager.addMessage('assistant', 'Hi there!');

      // Act
      const formattedHistory = contextManager.getFormattedHistory();

      // Assert
      const expected = 'user: Hello\nassistant: Hi there!';
      expect(formattedHistory).toBe(expected);
    });
  });

  // 4. clear Tests
  describe('clear', () => {
    beforeEach(() => {
      contextManager = new ContextManager(5);
    });

    it('should clear all messages from the history', () => {
      // Arrange
      contextManager.addMessage('user', 'message 1');
      contextManager.addMessage('assistant', 'message 2');

      // Act
      contextManager.clear();

      // Assert
      expect(contextManager.getFormattedHistory()).toBe('');
      expect(logSpy).toHaveBeenCalledWith("[ContextManager] Conversation history has been cleared.");
    });

    it('should not throw an error when clearing an already empty history', () => {
      // Arrange (History is already empty)

      // Act & Assert
      expect(() => contextManager.clear()).not.toThrow();
      expect(contextManager.getFormattedHistory()).toBe('');
    });
  });
});