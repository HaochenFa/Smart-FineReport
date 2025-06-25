/**
 * @file state-manager.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for state-manager.js
 */

// Polyfill for structuredClone in older Node.js environments used by Jest
// Jest 测试环境中较旧的 Node.js 可能没有 structuredClone，在此处添加 Polyfill
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

import {StateManager} from '@/app/state-manager';
import {describe, it, expect, beforeEach, jest} from '@jest/globals';

describe('StateManager', () => {
  let stateManager;

  // 在每个测试用例运行前，创建一个新的 StateManager 实例
  // 以确保测试之间相互独立，不受影响。
  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('Initialization', () => {
    it('should initialize with a default state if no initial state is provided', () => {
      const state = stateManager.getState();
      expect(state).toEqual({
        messages: [], isLoading: false, isDataStale: false,
      });
    });

    it('should initialize with the provided initial state', () => {
      const initialState = {
        messages: [{role: 'user', content: 'Hello'}], isLoading: true, isDataStale: false,
      };
      const customStateManager = new StateManager(initialState);
      const state = customStateManager.getState();
      expect(state).toEqual(initialState);
    });

    it('should merge the provided initial state with defaults', () => {
      const partialInitialState = {
        isLoading: true,
      };
      const customStateManager = new StateManager(partialInitialState);
      const state = customStateManager.getState();
      expect(state).toEqual({
        messages: [], isLoading: true, isDataStale: false,
      });
    });
  });

  describe('getState', () => {
    it('should return a deep copy of the state, not a reference', () => {
      const initialState = {
        messages: [{role: 'user', content: 'Test'}], isLoading: false, isDataStale: false,
      };
      const sm = new StateManager(initialState);

      const stateCopy1 = sm.getState();

      // 修改获取到的状态副本
      stateCopy1.isLoading = true;
      stateCopy1.messages.push({role: 'assistant', content: 'Modified'});

      const stateCopy2 = sm.getState();

      // 验证内部状态是否保持不变
      expect(stateCopy2).toEqual(initialState);
      expect(stateCopy2).not.toBe(stateCopy1); // 确保它们是不同的对象
    });
  });

  describe('setState', () => {
    it('should update the state by merging the new state object', () => {
      stateManager.setState({isLoading: true});
      const state = stateManager.getState();
      expect(state.isLoading).toBe(true);
      expect(state.messages).toEqual([]); // 其他状态应保持不变
    });

    it('should overwrite existing properties correctly', () => {
      const sm = new StateManager({isLoading: false});
      sm.setState({isLoading: true});
      const state = sm.getState();
      expect(state.isLoading).toBe(true);
    });
  });

  describe('Pub/Sub (subscribe and notify)', () => {
    it('should call a subscribed listener when state changes', () => {
      // jest.fn() 创建一个模拟函数，让我们可以追踪它的调用情况
      const listener = jest.fn();

      stateManager.subscribe(listener);
      stateManager.setState({isLoading: true});

      // 验证监听器是否被调用
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should provide the new state to the subscribed listener', () => {
      const listener = jest.fn();
      const newState = {isLoading: true};

      stateManager.subscribe(listener);
      stateManager.setState(newState);

      // 验证监听器被调用时，收到的参数是否是更新后的状态
      expect(listener).toHaveBeenCalledWith(expect.objectContaining(newState));
    });

    it('should call all subscribed listeners on a state change', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      stateManager.subscribe(listener1);
      stateManager.subscribe(listener2);

      stateManager.setState({isLoading: true});

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should not call a listener after it has been unsubscribed', () => {
      const listener = jest.fn();

      // subscribe 方法返回一个取消订阅的函数
      const unsubscribe = stateManager.subscribe(listener);

      // 第一次更新，监听器应该被调用
      stateManager.setState({isLoading: true});
      expect(listener).toHaveBeenCalledTimes(1);

      // 取消订阅
      unsubscribe();

      // 第二次更新，监听器不应该再被调用
      stateManager.setState({isLoading: false});
      expect(listener).toHaveBeenCalledTimes(1); // 调用次数仍为 1
    });

    it('should handle subscribing the same listener multiple times gracefully', () => {
      // 由于内部使用 Set，重复订阅同一个函数引用应该只被添加一次
      const listener = jest.fn();

      stateManager.subscribe(listener);
      stateManager.subscribe(listener);
      stateManager.subscribe(listener);

      stateManager.setState({isLoading: true});

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Convenience Methods', () => {
    it('addMessage() should add a message and notify listeners', () => {
      const listener = jest.fn();
      stateManager.subscribe(listener);

      const newMessage = {role: 'user', content: 'Can you help?'};
      stateManager.addMessage(newMessage);

      const state = stateManager.getState();
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0]).toEqual(newMessage);

      // 验证监听器也被正确调用
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        messages: [newMessage]
      }));
    });

    it('setLoading() should update the loading state and notify listeners', () => {
      const listener = jest.fn();
      stateManager.subscribe(listener);

      stateManager.setLoading(true);

      const state = stateManager.getState();
      expect(state.isLoading).toBe(true);

      // 验证监听器也被正确调用
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        isLoading: true
      }));
    });
  });
});