/**
 * @file context-manager.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for src/core/context-manager.js
 */

import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';

import {ContextManager} from '@/core/context-manager.js';
import {Logger as log} from '@/utils/logger.js';

/**
 * @describe Test suite for the ContextManager class.
 */
describe('ContextManager', () => {
  let contextManager;
  let logSpy;

  beforeEach(() => {
    contextManager = new ContextManager();
    // Create a spy on log.log to track calls without printing to console
    logSpy = jest.spyOn(log, 'log').mockImplementation(() => {
    });
  });

  afterEach(() => {
    // Restore all mocks after each test
    jest.restoreAllMocks();
  });

  it('should initialize with an empty history', () => {
    expect(contextManager.getHistory()).toEqual([]);
  });

  it('should add a message to the history', () => {
    const message = {role: 'user', content: 'Hello, AI!'};
    contextManager.addMessage(message.role, message.content);
    expect(contextManager.getHistory()).toEqual([message]);
    expect(logSpy).toHaveBeenCalledWith(`[ContextManager] Message added: { role: '${message.role}' }`);
  });

  it('should add multiple messages to the history', () => {
    const message1 = {role: 'user', content: 'Hello, AI!'};
    const message2 = {role: 'assistant', content: 'Hello, user!'};
    contextManager.addMessage(message1.role, message1.content);
    contextManager.addMessage(message2.role, message2.content);
    expect(contextManager.getHistory()).toEqual([message1, message2]);
  });

  it('should clear the history', () => {
    const message = {role: 'user', content: 'Some message'};
    contextManager.addMessage(message.role, message.content);
    contextManager.clear();
    expect(contextManager.getHistory()).toEqual([]);
    expect(logSpy).toHaveBeenCalledWith('[ContextManager] Conversation history has been cleared.');
  });

  it('getHistory should return an empty array for an empty history', () => {
    expect(contextManager.getHistory()).toEqual([]);
  });

  it('getHistory should return a correctly formatted array for a single message', () => {
    const message = {role: 'user', content: 'Test message'};
    contextManager.addMessage(message.role, message.content);
    expect(contextManager.getHistory()).toEqual([message]);
  });

  it('getHistory should return a correctly formatted array for multiple messages', () => {
    const message1 = {role: 'user', content: 'First message'};
    const message2 = {role: 'assistant', content: 'Second message'};
    contextManager.addMessage(message1.role, message1.content);
    contextManager.addMessage(message2.role, message2.content);
    expect(contextManager.getHistory()).toEqual([message1, message2]);
  });
});