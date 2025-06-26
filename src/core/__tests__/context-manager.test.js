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
    contextManager = new ContextManager(11); // Set capacity to 11 for testing
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

    it("should remove the third message (index 2) when history exceeds capacity", () => {
      // Fill the history to capacity (11 messages)
      contextManager.addMessage("user", "Initial Analysis Request"); // Index 0
      contextManager.addMessage("assistant", "Initial Analysis Report"); // Index 1
      contextManager.addMessage("user", "Follow-up 1"); // Index 2 - This one should be removed
      for (let i = 3; i < 11; i++) {
        contextManager.addMessage("user", `Message ${i}`);
      }

      let history = contextManager.getHistory();
      expect(history).toHaveLength(11);
      expect(history[2].content).toBe("Follow-up 1");

      // Add one more message to trigger truncation
      contextManager.addMessage("assistant", "Final Message");

      history = contextManager.getHistory();
      expect(history).toHaveLength(11); // Should remain at capacity

      // Verify the correct messages are preserved
      expect(history[0].content).toBe("Initial Analysis Request"); // Should be preserved
      expect(history[1].content).toBe("Initial Analysis Report"); // Should be preserved
      expect(history[2].content).not.toBe("Follow-up 1"); // The original third message should be gone
      expect(history[2].content).toBe("Message 3"); // The new third message
      expect(history[10].content).toBe("Final Message"); // The latest message should be at the end
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
