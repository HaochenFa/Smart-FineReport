/**
 * @file chat-view.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for chat-view.js
 */

import {describe, beforeEach, it, jest, expect} from "@jest/globals";

import {ChatView} from '@/ui/chat-view.js';

// Test suite for the ChatView class
describe('ChatView', () => {
  let container; // The DOM element where the chat UI will be rendered
  let chatView; // The instance of the ChatView class
  let mockOnSubmit; // A mock function to simulate the onSubmit callback

  /**
   * This function runs before each test case.
   * It sets up a clean DOM environment and initializes a new ChatView instance.
   */
  beforeEach(() => {
    // 1. Create a clean container in the document body for each test to ensure isolation.
    document.body.innerHTML = '<div id="chat-container"></div>';
    container = document.getElementById('chat-container');

    // 2. Create a Jest mock function to spy on the onSubmit callback.
    // This allows us to verify if it's called correctly without implementing its actual logic.
    mockOnSubmit = jest.fn();

    // 3. Instantiate the ChatView class with the container and the mock callback.
    chatView = new ChatView(container, mockOnSubmit);
  });

  // Test case group for rendering logic
  describe('Rendering', () => {
    it('should render the initial chat interface correctly', () => {
      // Act: Render the UI
      chatView.render();

      // Assert: Verify that all essential UI elements are created and appended to the DOM.
      const chatWindow = container.querySelector('.flex.flex-col.h-full');
      expect(chatWindow).not.toBeNull(); // The main chat window should exist.

      const messageContainer = container.querySelector('#message-container');
      expect(messageContainer).not.toBeNull(); // The message display area should exist.

      const inputArea = container.querySelector('.flex.items-center.p-4');
      expect(inputArea).not.toBeNull(); // The input area should exist.

      const inputField = container.querySelector('textarea');
      expect(inputField).not.toBeNull(); // The text input field should exist.
      expect(inputField.placeholder).toBe('输入你的消息...'); // Check placeholder text.

      const sendButton = container.querySelector('button');
      expect(sendButton).not.toBeNull(); // The send button should exist.
      expect(sendButton.textContent).toBe('发送'); // Check button text.

      const loadingIndicator = container.querySelector('.hidden.absolute');
      expect(loadingIndicator).not.toBeNull(); // The loading indicator should exist.
      expect(loadingIndicator.classList.contains('hidden')).toBe(true); // It should be hidden by default.
    });
  });

  // Test case group for message handling
  describe('Message Handling', () => {
    beforeEach(() => {
      chatView.render(); // Ensure the UI is rendered before each message test
    });

    it('should add a user message to the message container', () => {
      // Arrange: Define a user message object
      const userMessage = {role: 'user', content: 'Hello, World!'};

      // Act: Add the message to the view
      chatView.addMessage(userMessage);

      // Assert: Verify the message element is created with the correct content and classes
      const messageElement = chatView.messageContainer.querySelector('.justify-end');
      expect(messageElement).not.toBeNull(); // The message bubble container should be right-aligned.

      const bubble = messageElement.querySelector('.bg-gray-700.text-white');
      expect(bubble).not.toBeNull(); // The bubble should have user-specific styling.
      expect(bubble.textContent).toBe(userMessage.content); // The content should match.
    });

    it('should add an assistant message to the message container', () => {
      // Arrange: Define an assistant message object
      const assistantMessage = {role: 'assistant', content: 'How can I help you?'};

      // Act: Add the message to the view
      chatView.addMessage(assistantMessage);

      // Assert: Verify the message element is created with the correct content and classes
      const messageElement = chatView.messageContainer.querySelector('.justify-start');
      expect(messageElement).not.toBeNull(); // The message bubble container should be left-aligned.

      const bubble = messageElement.querySelector('.bg-gray-200.text-gray-800');
      expect(bubble).not.toBeNull(); // The bubble should have assistant-specific styling.
      expect(bubble.textContent).toBe(assistantMessage.content); // The content should match.
    });
  });

  // Test case group for user interactions
  describe('User Interaction', () => {
    beforeEach(() => {
      chatView.render(); // Ensure the UI is rendered before each interaction test
    });

    it('should call onSubmit with the input value when send button is clicked', () => {
      // Arrange: Set a value in the input field
      const inputText = 'This is a test message.';
      chatView.inputField.value = inputText;

      // Act: Simulate a click on the send button
      chatView.sendButton.click();

      // Assert: Check if the mock callback was called correctly
      expect(mockOnSubmit).toHaveBeenCalledTimes(1); // It should be called exactly once.
      expect(mockOnSubmit).toHaveBeenCalledWith(inputText); // It should be called with the trimmed input text.
    });

    it('should call onSubmit when Enter key is pressed without Shift key', () => {
      // Arrange: Set a value in the input field
      const inputText = 'Another test message.';
      chatView.inputField.value = inputText;

      // Act: Simulate a 'Enter' key press event
      const enterEvent = new KeyboardEvent('keypress', {key: 'Enter', bubbles: true});
      chatView.inputField.dispatchEvent(enterEvent);

      // Assert: Check if the mock callback was called correctly
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(inputText);
    });

    it('should NOT call onSubmit when Enter key is pressed with Shift key', () => {
      // Arrange: Set a value and simulate a key press with Shift
      chatView.inputField.value = 'A message with a newline.';
      const shiftEnterEvent = new KeyboardEvent('keypress', {key: 'Enter', shiftKey: true, bubbles: true});

      // Act: Dispatch the event
      chatView.inputField.dispatchEvent(shiftEnterEvent);

      // Assert: The callback should not have been triggered
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should NOT call onSubmit if the input is empty or just whitespace', () => {
      // Arrange: Set the input value to spaces
      chatView.inputField.value = '   ';

      // Act: Simulate a click
      chatView.sendButton.click();

      // Assert: The callback should not have been triggered
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear the input field after a message is submitted', () => {
      // This test checks the clearInput method, which is typically called by a controller after submission.
      // Arrange
      chatView.inputField.value = 'Some text to be cleared.';

      // Act
      chatView.clearInput();

      // Assert
      expect(chatView.inputField.value).toBe('');
    });
  });

  // Test case group for UI state changes
  describe('UI State', () => {
    beforeEach(() => {
      chatView.render(); // Ensure the UI is rendered first
    });

    it('toggleLoading(true) should show loading indicator and disable inputs', () => {
      // Act
      chatView.toggleLoading(true);

      // Assert
      expect(chatView.loadingIndicator.classList.contains('hidden')).toBe(false);
      expect(chatView.inputField.disabled).toBe(true);
      expect(chatView.sendButton.disabled).toBe(true);
    });

    it('toggleLoading(false) should hide loading indicator and enable inputs', () => {
      // Arrange: First, show the loading state
      chatView.toggleLoading(true);

      // Act: Then, hide it
      chatView.toggleLoading(false);

      // Assert
      expect(chatView.loadingIndicator.classList.contains('hidden')).toBe(true);
      expect(chatView.inputField.disabled).toBe(false);
      expect(chatView.sendButton.disabled).toBe(false);
    });
  });
});