import {describe, beforeEach, it, expect, jest} from "@jest/globals";
import {ChatView} from "@/ui/chat-view.js";

describe("ChatView", () => {
  let container;
  let chatView;
  let onSubmitMock;
  let onResetMock;

  beforeEach(() => {
    document.body.innerHTML = "<div id=\"chat-container\"></div>";
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
      // Check for the presence of the send button by its class
      expect(container.querySelector("button.bg-blue-600")).not.toBeNull();
      // Check for the presence of the reset button by its class
      expect(container.querySelector("button.bg-gray-200")).not.toBeNull();
    });
  });

  describe("User Interaction", () => {
    it("should call onSubmit when the send button is clicked", () => {
      const textarea = container.querySelector("textarea");
      textarea.value = "Hello, world!";
      container.querySelector("button.bg-blue-600").click(); // Updated selector
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
    it("addMessage should add a user message to the container", async () => {
      await chatView.addMessage({role: "user", content: "User message"});
      const messageElement = container.querySelector(".justify-end");
      expect(messageElement).not.toBeNull();
      expect(messageElement.textContent).toBe("User message");
    });

    it("addMessage should add an assistant message to the container", async () => {
      await chatView.addMessage({role: "assistant", content: "Assistant message"});
      const messageElement = container.querySelector(".justify-start");
      expect(messageElement).not.toBeNull();
      // Marked will wrap the content in a <p> tag
      expect(messageElement.querySelector('p').textContent).toBe("Assistant message");
    });

    it("createProgressMessage should create and return a new message bubble", () => {
      const progressBubble = chatView.createProgressMessage();
      expect(progressBubble).not.toBeNull();
      // Updated class name
      expect(progressBubble.classList.contains("bg-white")).toBe(true);
      expect(chatView.messageContainer.contains(progressBubble)).toBe(true);
    });

    it("updateMessage should set the innerHTML of a given element", async () => {
      const progressBubble = chatView.createProgressMessage();
      const newHtml = "<p>Loading...</p>";
      await chatView.updateMessage(progressBubble, newHtml);
      // Use toContain because marked might add extra wrappers
      expect(progressBubble.innerHTML).toContain(newHtml);
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