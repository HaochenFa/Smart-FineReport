/**
 * @file context-manager.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for context-manager.js.
 */

import {describe, it, expect, beforeEach} from "@jest/globals";
import {ContextManager} from "@/core/context-manager.js";

describe("ContextManager", () => {
  let contextManager;

  beforeEach(() => {
    contextManager = new ContextManager(5); // Set capacity to 5 for testing
  });

  describe("addMessage", () => {
    it("should add a message to the history", () => {
      contextManager.addMessage("user", "Hello");
      const history = contextManager.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual({role: "user", content: "Hello"});
    });

    it("should not add a system message to the history", () => {
      contextManager.addMessage("system", "You are a helpful assistant.");
      const history = contextManager.getHistory();
      expect(history).toHaveLength(0);
    });

    it("should truncate history when it exceeds capacity", () => {
      contextManager.addMessage("user", "1");
      contextManager.addMessage("assistant", "2");
      contextManager.addMessage("user", "3");
      contextManager.addMessage("assistant", "4");
      contextManager.addMessage("user", "5");
      contextManager.addMessage("assistant", "6"); // This should cause truncation

      const history = contextManager.getHistory();
      expect(history).toHaveLength(5);
      expect(history[0].content).toBe("2"); // The first message ("1") should be gone
    });
  });

  describe("getHistory", () => {
    it("should return a copy of the history, not a reference", () => {
      contextManager.addMessage("user", "Original");
      const history1 = contextManager.getHistory();
      history1.push({role: "user", content: "Modified"});
      const history2 = contextManager.getHistory();
      expect(history2).toHaveLength(1);
      expect(history2[0].content).toBe("Original");
    });
  });

  describe("clear", () => {
    it("should clear the entire message history", () => {
      contextManager.addMessage("user", "Message 1");
      contextManager.addMessage("assistant", "Message 2");
      contextManager.clear();
      const history = contextManager.getHistory();
      expect(history).toHaveLength(0);
    });
  });
});
