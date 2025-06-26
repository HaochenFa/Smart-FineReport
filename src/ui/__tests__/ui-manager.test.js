/**
 * @file ui-manager.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for UIManager, updated for progress-tracking functionality.
 */

import {jest, describe, it, expect, beforeEach, beforeAll} from '@jest/globals';

// --- Module-Level Variables ---
let UIManager;
let ChatView; // Mocked ChatView constructor
let currentMockViewInstance; // Direct reference to the mock instance

// --- ESM Mocking Setup ---
beforeAll(async () => {
  jest.unstable_mockModule('@/ui/chat-view.js', () => ({
    ChatView: jest.fn().mockImplementation(() => {
      const instance = {
        render: jest.fn(),
        addMessage: jest.fn(),
        clearInput: jest.fn(),
        updateResetButton: jest.fn(),
        // New methods for progress tracking
        createProgressMessage: jest.fn(() => document.createElement('div')), // Return a mock DOM element
        updateMessage: jest.fn(),
        removeMessage: jest.fn(),
        _renderProgressSteps: jest.fn(stages => `<p>${stages.length} stages</p>`), // Return mock HTML
        // Add a mock for the old function to ensure it's NOT called.
        toggleLoading: jest.fn(),
        // DOM element properties for input control
        inputField: {disabled: false},
        sendButton: {disabled: false},
        resetButton: {disabled: false},
        messageContainer: {innerHTML: ''},
      };
      currentMockViewInstance = instance;
      return instance;
    }),
  }));

  const uiManagerModule = await import('@/ui/ui-manager.js');
  UIManager = uiManagerModule.UIManager;

  const chatViewModule = await import('@/ui/chat-view.js');
  ChatView = chatViewModule.ChatView;
});

// --- Test Suite ---
describe('UIManager', () => {
  let mockContainer;
  let mockStateManager;
  let mockMessageSubmitHandler;
  let mockResetAnalysisHandler;
  let uiManager;

  beforeEach(() => {
    jest.clearAllMocks();
    currentMockViewInstance = null;

    mockContainer = document.createElement('div');
    const initialMockState = {messages: [], isDataStale: false};
    mockStateManager = {
      getState: jest.fn().mockReturnValue(initialMockState),
      subscribe: jest.fn(),
      addMessage: jest.fn(), // Mock addMessage for user messages
    };
    mockMessageSubmitHandler = jest.fn();
    mockResetAnalysisHandler = jest.fn();

    // Instantiate UIManager for each test
    uiManager = new UIManager(mockContainer, mockStateManager, mockMessageSubmitHandler, mockResetAnalysisHandler);
  });

  describe('Initialization and State Updates', () => {
    it('should initialize ChatView and subscribe to state changes', () => {
      expect(ChatView).toHaveBeenCalledTimes(1);
      expect(currentMockViewInstance.render).toHaveBeenCalledTimes(1);
      expect(mockStateManager.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should update messages and reset button on state change, ignoring isLoading', () => {
      const stateUpdateListener = mockStateManager.subscribe.mock.calls[0][0];
      const newState = {
        messages: [{role: 'user', content: 'New Message'}],
        isDataStale: true,
        isLoading: true, // This property should be ignored by the new logic
      };

      stateUpdateListener(newState);

      expect(currentMockViewInstance.addMessage).toHaveBeenCalledWith(newState.messages[0]);
      expect(currentMockViewInstance.updateResetButton).toHaveBeenCalledWith(true);
      // Ensure old loading logic is not called
      expect(currentMockViewInstance.toggleLoading).not.toHaveBeenCalled();
    });
  });

  describe('Input and Progress Control', () => {
    it('disableInputs should disable all relevant view inputs', () => {
      uiManager.disableInputs();
      expect(currentMockViewInstance.inputField.disabled).toBe(true);
      expect(currentMockViewInstance.sendButton.disabled).toBe(true);
      expect(currentMockViewInstance.resetButton.disabled).toBe(true);
    });

    it('enableInputs should enable all relevant view inputs', () => {
      uiManager.disableInputs(); // First disable
      uiManager.enableInputs(); // Then enable
      expect(currentMockViewInstance.inputField.disabled).toBe(false);
      expect(currentMockViewInstance.sendButton.disabled).toBe(false);
      expect(currentMockViewInstance.resetButton.disabled).toBe(false);
    });

    it('addUserMessage should add a message to the state manager', () => {
      const userInput = "Hello there";
      uiManager.addUserMessage(userInput);
      expect(mockStateManager.addMessage).toHaveBeenCalledWith({role: 'user', content: userInput});
    });

    it('showProgressTracker should call the view to create a progress message element', () => {
      const progressElement = uiManager.showProgressTracker();
      expect(currentMockViewInstance.createProgressMessage).toHaveBeenCalledTimes(1);
      expect(progressElement).toBeDefined();
    });

    it('updateProgress should correctly calculate statuses and update the view', () => {
      const progressElement = document.createElement('div');
      const stages = [{id: 'A'}, {id: 'B'}, {id: 'C'}];
      uiManager.updateProgress(progressElement, stages, 'B');

      const expectedStages = [
        {id: 'A', status: 'completed'},
        {id: 'B', status: 'inprogress'},
        {id: 'C', status: 'pending'},
      ];

      expect(currentMockViewInstance._renderProgressSteps).toHaveBeenCalledWith(expectedStages);
      expect(currentMockViewInstance.updateMessage).toHaveBeenCalledWith(progressElement, expect.any(String));
    });

    it('renderError should correctly calculate failure status and update the view', () => {
      const progressElement = document.createElement('div');
      const stages = [{id: 'A'}, {id: 'B'}, {id: 'C'}];
      const error = new Error('Test Error');
      uiManager.renderError(progressElement, stages, error, 'B');

      const expectedStages = [
        {id: 'A', status: 'completed'},
        {id: 'B', status: 'failed'},
        {id: 'C', status: 'pending'},
      ];

      expect(currentMockViewInstance._renderProgressSteps).toHaveBeenCalledWith(expectedStages);
      const expectedHtml = `${currentMockViewInstance._renderProgressSteps(expectedStages)}<div class="text-red-500 mt-2"><p class="font-bold">分析失败:</p><p>Test Error</p></div>`;
      expect(currentMockViewInstance.updateMessage).toHaveBeenCalledWith(progressElement, expectedHtml);
    });
  });
});
