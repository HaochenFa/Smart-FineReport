/**
 * @file context-manager.js
 * @author Haochen (Billy) Fa
 * @description Manages the conversation history for the AI model, ensuring it doesn"t exceed a specific token limit.
 */
import { Logger } from "../utils/logger.js";

const DEFAULT_MAX_MESSAGES = 11; // Default number of messages to keep in history

export class ContextManager {
  /**
   * @param {number} maxMessages - The maximum number of messages to retain in the history.
   */
  constructor(maxMessages = DEFAULT_MAX_MESSAGES) {
    this.maxMessages = maxMessages;
    this.history = [];
    Logger.log(
      `[ContextManager] ContextManager initialized. Maximum history capacity set to ${this.maxMessages} messages.`
    );
  }

  /**
   * Adds a message to the conversation history.
   * @param {string} role - The role of the message sender (e.g., "user", "assistant").
   * @param {string} content - The content of the message.
   */
  addMessage(role, content) {
    if (role === "system") {
      Logger.log(`[ContextManager] System message is not added to history: { role: "${role}" }`);
      return; // Do not add system messages to the history
    }

    const message = { role, content };
    this.history.push(message);
    Logger.log(`[ContextManager] Message added: { role: "${role}" }`);

    // Truncate history if it exceeds the maximum size
    if (this.history.length > this.maxMessages) {
      // If the history is too long, remove the third message (index 2),
      // which is the first user follow-up question after the initial analysis.
      // This preserves the initial analysis (index 0 and 1) and recent conversations.
      this.history.splice(2, 1);
      Logger.log("[ContextManager] History exceeded max size. Oldest non-initial message removed.");
    }
  }

  /**
   * Retrieves the current conversation history.
   * @returns {Array<Object>} A copy of the conversation history.
   */
  getHistory() {
    Logger.log(
      `[ContextManager] Returning conversation history with ${this.history.length} messages.`
    );
    return [...this.history]; // Return a shallow copy
  }

  /**
   * Clears the entire conversation history.
   */
  clear() {
    this.history = [];
    Logger.log("[ContextManager] Conversation history has been cleared.");
  }
}
