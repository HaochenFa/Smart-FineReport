/**
 * @file state-manager.js
 * @author Haochen (Billy) Fa
 * @description The core of UI layer UI 层的核心
 */

import { Logger } from "../utils/logger.js";

export class StateManager {
  /**
   * 构造一个 StateManager 实例。
   * @param {object} [initialState={}] - 应用的可选初始状态。
   */
  constructor(initialState = {}) {
    /**
     * @private
     * 应用的内部状态。
     * @type {{messages: Array<{role: string, content: string}>, isLoading: boolean}}
     */
    this._state = {
      messages: [], // 存放所有聊天消息。
      isLoading: false, // 如果应用正在等待响应，则为 true。
      isDataStale: false, // 如果报表数据已更新，则为 true
      ...initialState, // 与传入的初始状态合并
    };

    /**
     * @private
     * 存储所有订阅了状态更新的回调函数（监听器）。
     * 使用 Set 可以自动处理重复的监听器。
     * @type {Set<function(object): void>}
     */
    this._listeners = new Set();
  }

  /**
   * 获取当前状态的副本。
   * 返回副本可以防止对内部状态对象的直接、意外的修改。
   * @returns {{messages: Array, isLoading: boolean}} 当前状态的副本。
   */
  getState() {
    // 优先使用 structuredClone（性能更好），降级到 JSON 深拷贝以确保兼容性
    if (typeof structuredClone === "function") {
      return structuredClone(this._state);
    }

    // 降级到 JSON 深拷贝
    try {
      return JSON.parse(JSON.stringify(this._state));
    } catch {
      // 最后降级到浅拷贝
      Logger.warn("[StateManager] Deep clone failed, using shallow copy");
      return { ...this._state };
    }
  }

  /**
   * 订阅状态变更。
   * @param {function(object): void} callback - 当状态变更时要执行的回调函数。
   * @returns {function(): void} 一个用于取消订阅的函数。
   */
  subscribe(callback) {
    this._listeners.add(callback);

    // 返回一个函数，调用此函数即可取消订阅
    return () => {
      this._listeners.delete(callback);
    };
  }

  /**
   * 一个通过合并新状态对象来更新状态的通用方法。
   * 状态更新后，它会通知所有订阅者。
   * @param {object} newState - 包含要更新的状态属性的对象。
   */
  setState(newState) {
    // 将当前状态与新状态合并以创建更新后的状态。
    this._state = { ...this._state, ...newState };

    // “发布”变更：通知所有注册的监听器
    this._listeners.forEach((listener) => listener(this.getState()));
  }

  /**
   * 一个向消息列表中添加消息并更新状态的便捷方法。
   * @param {{role: string, content: string}} message - 要添加的消息对象。
   */
  addMessage(message) {
    const newMessages = [...this._state.messages, message];
    this.setState({ messages: newMessages });
  }

  /**
   * 一个设置应用加载状态的便捷方法。
   * @param {boolean} isLoading - 新的加载状态。
   */
  setLoading(isLoading) {
    this.setState({ isLoading });
  }
}
