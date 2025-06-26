/**
 * @file chat-view.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for chat-view.js, updated for progress-tracking functionality.
 */

import {describe, beforeEach, it, expect, jest} from "@jest/globals";
import {ChatView} from "@/ui/chat-view.js";

describe("ChatView", () => {
  let container;
  let chatView;
  let onSubmitMock;
  let onResetMock;

  beforeEach(() => {
    document.body.innerHTML = '<div id="chat-container"></div>';
    container = document.getElementById("chat-container");
    onSubmitMock = jest.fn();
    onResetMock = jest.fn();
    chatView = new ChatView(container, onSubmitMock, onResetMock);
    chatView.render();
  });

  describe("Initial Rendering", () => {
    it("should render the basic structure correctly", () => {
      expect(container.querySelector("#message-container")).not.toBeNull();
      expect(container.querySelector("textarea")).not.toBeNull();
      expect(container.querySelector("button").textContent).toBe("发送");
    });
  });

  describe("User Interaction", () => {
    it("should call onSubmit when the send button is clicked", () => {
      const textarea = container.querySelector("textarea");
      textarea.value = "Hello, world!";
      container.querySelector("button.bg-gray-800").click();
      expect(onSubmitMock).toHaveBeenCalledWith("Hello, world!");
    });

    it("should call onReset when the reset button is clicked", () => {
      container.querySelector("button.bg-gray-200").click();
      expect(onResetMock).toHaveBeenCalled();
    });

    it("should call onSubmit when Enter is pressed without Shift", () => {
      const textarea = container.querySelector("textarea");
      textarea.value = "Test message";
      const event = new KeyboardEvent("keypress", {key: "Enter", bubbles: true});
      textarea.dispatchEvent(event);
      expect(onSubmitMock).toHaveBeenCalledWith("Test message");
    });

    it("should not call onSubmit when Enter is pressed with Shift", () => {
      const textarea = container.querySelector("textarea");
      textarea.value = "Test message";
      const event = new KeyboardEvent("keypress", {key: "Enter", shiftKey: true, bubbles: true});
      textarea.dispatchEvent(event);
      expect(onSubmitMock).not.toHaveBeenCalled();
    });

    it("should auto-resize the textarea on input", () => {
      const textarea = container.querySelector("textarea");
      const initialHeight = textarea.style.height;
      textarea.value = "This is a long message that should cause the textarea to resize.";
      textarea.dispatchEvent(new Event("input", {bubbles: true}));
      expect(textarea.style.height).not.toBe(initialHeight);
    });
  });

  describe("Message Handling", () => {
    it("addMessage should add a user message to the container", () => {
      chatView.addMessage({role: "user", content: "User message"});
      const messageElement = container.querySelector(".justify-end");
      expect(messageElement).not.toBeNull();
      expect(messageElement.textContent).toBe("User message");
    });

    it("addMessage should add an assistant message to the container", () => {
      chatView.addMessage({role: "assistant", content: "Assistant message"});
      const messageElement = container.querySelector(".justify-start");
      expect(messageElement).not.toBeNull();
      expect(messageElement.textContent).toBe("Assistant message");
    });

    it("createProgressMessage should create and return a new message bubble", () => {
      const progressBubble = chatView.createProgressMessage();
      expect(progressBubble).not.toBeNull();
      expect(progressBubble.classList.contains("bg-gray-200")).toBe(true);
      expect(chatView.messageContainer.contains(progressBubble)).toBe(true);
    });

    it("updateMessage should set the innerHTML of a given element", () => {
      const progressBubble = chatView.createProgressMessage();
      const newHtml = "<p>Loading...</p>";
      chatView.updateMessage(progressBubble, newHtml);
      expect(progressBubble.innerHTML).toBe(newHtml);
    });

    it("removeMessage should remove the entire message element from the DOM", () => {
      const progressBubble = chatView.createProgressMessage();
      const messageElementWrapper = progressBubble.parentElement;
      expect(chatView.messageContainer.contains(messageElementWrapper)).toBe(true);
      chatView.removeMessage(progressBubble);
      expect(chatView.messageContainer.contains(messageElementWrapper)).toBe(false);
    });
  });

  describe("UI Updates", () => {
    it("updateResetButton should add a stale dot when isStale is true", () => {
      chatView.updateResetButton(true);
      const dot = container.querySelector(".stale-dot");
      expect(dot).not.toBeNull();
    });

    it("updateResetButton should remove the stale dot when isStale is false", () => {
      chatView.updateResetButton(true); // First add it
      chatView.updateResetButton(false); // Then remove it
      const dot = container.querySelector(".stale-dot");
      expect(dot).toBeNull();
    });

    it("clearInput should clear the textarea and reset its height", () => {
      const textarea = container.querySelector("textarea");
      textarea.value = "Some text";
      textarea.style.height = "100px";
      chatView.clearInput();
      expect(textarea.value).toBe("");
      expect(textarea.style.height).toBe("auto");
    });
  });
});