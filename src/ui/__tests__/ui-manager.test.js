/**
 * @file ui-manager.test.js
 * @author Haochen (Billy) Fa
 *  @description Unit test for ui-manager
 */

import {jest, describe, it, expect, beforeEach, beforeAll} from '@jest/globals';

// --- Module-Level Variables ---
// These will be populated after the mocks are set up.
let UIManager;
let ChatView; // This will hold our mocked ChatView constructor.
// This variable will hold a direct reference to the mock instance created during each test.
let currentMockViewInstance;

// --- ESM Mocking Setup ---
// This block runs once before all tests in the file.
beforeAll(async () => {
  // 1. Use jest.unstable_mockModule to mock the entire ChatView module BEFORE it's imported.
  jest.unstable_mockModule('@/ui/chat-view.js', () => ({
    // The factory must return an object representing the module's exports.
    ChatView: jest.fn().mockImplementation((container, submitCallback) => {
      // Create a fresh mock instance object for each `new ChatView()` call.
      const instance = {
        render: jest.fn(),
        addMessage: jest.fn(),
        clearInput: jest.fn(),
        toggleLoading: jest.fn(),
        messageContainer: {innerHTML: ''},
        // We add a helper to our mock instance to simulate user actions from the view.
        _triggerSubmit: (text) => submitCallback(text),
      };
      // Capture a reference to this specific instance so the test can access it.
      currentMockViewInstance = instance;
      return instance;
    }),
  }));

  // 2. Dynamically import the modules ONLY AFTER the mocks have been defined.
  const uiManagerModule = await import('@/ui/ui-manager.js');
  UIManager = uiManagerModule.UIManager;

  const chatViewModule = await import('@/ui/chat-view.js');
  ChatView = chatViewModule.ChatView; // Capture the mocked ChatView constructor for assertions.
});


// --- Test Suite ---
describe('UIManager', () => {
  // --- Test Setup ---
  let mockContainer;
  let mockStateManager;
  let mockMessageSubmitHandler;
  let initialMockState;

  // beforeEach runs before each individual `it` block.
  beforeEach(() => {
    // Clear mock history to ensure test isolation.
    jest.clearAllMocks();
    // Reset the instance holder before each test.
    currentMockViewInstance = null;

    // Re-create mock data for each test.
    mockContainer = document.createElement('div');
    initialMockState = {
      messages: [
        {role: 'user', content: 'Hello'},
        {role: 'assistant', content: 'Hi there!'},
      ],
      isLoading: false,
    };
    mockStateManager = {
      getState: jest.fn().mockReturnValue(initialMockState),
      onStateChange: null, // UIManager will assign its callback to this.
    };
    mockMessageSubmitHandler = jest.fn();
  });

  // --- Test Cases ---

  describe('Constructor and Initialization', () => {
    it('should throw an error if constructor arguments are invalid', () => {
      const errorMsg = 'UIManager: 无效的构造函数参数。';
      expect(() => new UIManager(null, mockStateManager, mockMessageSubmitHandler)).toThrow(errorMsg);
      expect(() => new UIManager(mockContainer, null, mockMessageSubmitHandler)).toThrow(errorMsg);
      expect(() => new UIManager(mockContainer, mockStateManager, null)).toThrow(errorMsg);
    });

    it('should instantiate the (mocked) ChatView with the correct arguments', () => {
      new UIManager(mockContainer, mockStateManager, mockMessageSubmitHandler);
      expect(ChatView).toHaveBeenCalledTimes(1);
      expect(ChatView).toHaveBeenCalledWith(mockContainer, expect.any(Function));
    });

    it('should call init methods and render the initial state correctly', () => {
      new UIManager(mockContainer, mockStateManager, mockMessageSubmitHandler);

      // 1. Verify init flow
      expect(mockStateManager.getState).toHaveBeenCalledTimes(1);
      expect(currentMockViewInstance.render).toHaveBeenCalledTimes(1);

      // 2. Verify initial message rendering
      expect(currentMockViewInstance.messageContainer.innerHTML).toBe(''); // Cleared first
      expect(currentMockViewInstance.addMessage).toHaveBeenCalledTimes(initialMockState.messages.length);
      expect(currentMockViewInstance.addMessage).toHaveBeenCalledWith(initialMockState.messages[0]);
      expect(currentMockViewInstance.addMessage).toHaveBeenCalledWith(initialMockState.messages[1]);

      // 3. Verify initial loading state
      expect(currentMockViewInstance.toggleLoading).toHaveBeenCalledTimes(1);
      expect(currentMockViewInstance.toggleLoading).toHaveBeenCalledWith(initialMockState.isLoading);

      // 4. Verify state binding
      expect(mockStateManager.onStateChange).toBeInstanceOf(Function);
    });
  });

  describe('State Updates', () => {
    it('should update the view correctly when state changes', () => {
      new UIManager(mockContainer, mockStateManager, mockMessageSubmitHandler);

      // Clear initial calls for a clean test of the update logic
      jest.clearAllMocks();

      const newState = {
        messages: [{role: 'user', content: 'New question'}],
        isLoading: true,
      };

      // Manually trigger the state change handler that UIManager has subscribed to.
      mockStateManager.onStateChange(newState);

      // 1. Verify message update logic
      expect(currentMockViewInstance.messageContainer.innerHTML).toBe(''); // Should be cleared
      expect(currentMockViewInstance.addMessage).toHaveBeenCalledTimes(1);
      expect(currentMockViewInstance.addMessage).toHaveBeenCalledWith(newState.messages[0]);

      // 2. Verify loading state update logic
      expect(currentMockViewInstance.toggleLoading).toHaveBeenCalledTimes(1);
      expect(currentMockViewInstance.toggleLoading).toHaveBeenCalledWith(true);
    });

    it('should handle empty or null messages array gracefully', () => {
      new UIManager(mockContainer, mockStateManager, mockMessageSubmitHandler);

      jest.clearAllMocks(); // Clear initial calls

      const newState = {messages: [], isLoading: false};
      mockStateManager.onStateChange(newState);

      // Verify container is cleared but addMessage is not called
      expect(currentMockViewInstance.messageContainer.innerHTML).toBe('');
      expect(currentMockViewInstance.addMessage).not.toHaveBeenCalled();

      // Test with null
      const newStateNull = {messages: null, isLoading: false};
      mockStateManager.onStateChange(newStateNull);
      expect(currentMockViewInstance.messageContainer.innerHTML).toBe('');
      expect(currentMockViewInstance.addMessage).not.toHaveBeenCalled();
    });
  });

  describe('User Interaction', () => {
    it('should handle user submit by calling the handler and clearing input', () => {
      new UIManager(mockContainer, mockStateManager, mockMessageSubmitHandler);
      const userMessage = 'This is a test message from the user.';

      // Use the helper on the mock instance to simulate the view firing an event.
      currentMockViewInstance._triggerSubmit(userMessage);

      // 1. Verify the external handler was called with the correct message
      expect(mockMessageSubmitHandler).toHaveBeenCalledTimes(1);
      expect(mockMessageSubmitHandler).toHaveBeenCalledWith(userMessage);

      // 2. Verify the view's input was cleared
      expect(currentMockViewInstance.clearInput).toHaveBeenCalledTimes(1);
    });
  });
});