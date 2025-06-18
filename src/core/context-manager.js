/**
 * @file src/core/ContextManager.js
 * @author Haochen (Billy) Fa
 * @description 存储和管理多轮对话的上下文历史记录。
 * Manages the context history of a multi-turn conversation.
 */

/**
 * @class ContextManager
 * @description 一个用于管理对话历史的类。
 * A class for managing conversation history.
 */
export class ContextManager {
  /**
   * 构造函数
   * @param {number} [maxMessages=10] - 要在历史记录中存储的最大消息数。
   * The maximum number of messages to store in the history.
   */
  constructor(maxMessages = 10) {
    /**
     * @private
     * @type {Array<Object>}
     * @description 存储对话消息的数组。
     * An array to store conversation messages.
     * Each message is an object: { role: string, content: string }
     */
    this.history = [];

    /**
     * @private
     * @type {number}
     * @description 历史记录中允许的最大消息数。
     * The maximum number of messages allowed in the history.
     */
    this.maxMessages = maxMessages;

    // 为了符合您提供的 Logger 风格，此处使用 console.log 进行初始化提示。
    // In alignment with the Logger style you provided, console.log is used for initialization notifications.
    console.log(`[ContextManager] ContextManager initialized. Maximum history capacity set to ${this.maxMessages} messages.`);
  }

  /**
   * @description 将一条消息添加到对话历史中。如果历史记录超出了最大容量，则会移除最旧的消息。
   * Adds a message to the conversation history. If the history exceeds the maximum capacity, the oldest message is removed.
   * @param {string} role - 消息发送者的角色 (例如, 'user', 'assistant')。
   * The role of the message sender (e.g., 'user', 'assistant').
   * @param {string} content - 消息的内容。
   * The content of the message.
   * @returns {void}
   */
  addMessage(role, content) {
    // 参数校验 (Parameter Validation)
    if (typeof role !== 'string' || !role.trim() || typeof content !== 'string' || !content.trim()) {
      console.error("[ContextManager] Invalid arguments. 'role' and 'content' must be non-empty strings.");
      return;
    }

    const message = {role, content};
    this.history.push(message);

    // 检查历史记录是否超出最大容量 (Check if history exceeds max capacity)
    if (this.history.length > this.maxMessages) {
      // 移除数组中的第一条 (最旧的) 消息
      // Remove the first (oldest) message from the array
      this.history.shift();
      console.log("[ContextManager] History exceeded max size. Oldest message removed.");
    }

    console.log(`[ContextManager] Message added: { role: '${role}' }`);
  }

  /**
   * @description 以格式化的字符串形式检索对话历史记录。
   * Retrieves the conversation history as a formatted string.
   * @returns {string} 格式化的对话历史记录，每条消息占一行。如果历史记录为空，则返回一个空字符串。
   * The formatted conversation history, with each message on a new line. Returns an empty string if the history is empty.
   */
  getFormattedHistory() {
    if (this.history.length === 0) {
      return ""; // 如果没有历史记录，返回空字符串
    }
    return this.history
      .map(msg => `${msg.role}: ${msg.content}`)
      .join("\n");
  }

  /**
   * @description 清空整个对话历史记录。
   * Clears the entire conversation history.
   * @returns {void}
   */
  clear() {
    this.history = [];
    console.log("[ContextManager] Conversation history has been cleared.");
  }
}
