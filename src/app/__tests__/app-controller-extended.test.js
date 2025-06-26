/**
 * @file app-controller-extended.test.js
 * @author Haochen (Billy) Fa
 * @description Additional unit tests for AppController to cover analysis workflows.
 */

import {jest, describe, it, expect, beforeAll, beforeEach, afterEach} from "@jest/globals";

// --- Mocking all dependencies ---
const mockStateManager = {
  setState: jest.fn(),
  getState: jest.fn(() => ({messages: []})),
};

const mockUiManagerInstance = {
  init: jest.fn(),
  container: null,
};

const mockPipeline = {
  run: jest.fn(),
};

const mockContextManager = {
  addMessage: jest.fn(),
  clear: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockHtml2canvas = jest.fn();

// Use unstable_mockModule for ESM support
jest.unstable_mockModule("@/app/state-manager.js", () => ({
  StateManager: jest.fn(() => mockStateManager),
}));
jest.unstable_mockModule("@/ui/ui-manager.js", () => ({
  UIManager: jest.fn((containerElement) => {
    mockUiManagerInstance.container = containerElement;
    return mockUiManagerInstance;
  }),
}));
jest.unstable_mockModule("@/core/ai-analysis-pipeline.js", () => ({
  AnalysisPipeline: jest.fn(() => mockPipeline),
}));
jest.unstable_mockModule("@/core/context-manager.js", () => ({
  ContextManager: jest.fn(() => mockContextManager),
}));
jest.unstable_mockModule("@/utils/logger.js", () => ({
  Logger: mockLogger,
}));
jest.unstable_mockModule("html2canvas", () => ({
  default: mockHtml2canvas,
}));


describe("AppController Analysis Workflows", () => {
  let AppController;
  let appController;

  beforeAll(async () => {
    // Dynamically import the module AFTER mocks are defined
    AppController = (await import("../app-controller.js")).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the DOM environment
    document.body.innerHTML = `<div id="app"></div>`;
    const appContainer = document.getElementById("app");
    // This spy is crucial for the init method to find the container
    jest.spyOn(document, "querySelector").mockReturnValue(appContainer);

    // Reset mock implementations for each test
    mockPipeline.run.mockResolvedValue("AI response");
    mockHtml2canvas.mockResolvedValue({toDataURL: () => "fake_image_data"});
    mockStateManager.getState.mockReturnValue({messages: []});

    // Instantiate the controller
    appController = new AppController("http://fake.url");

    // Spy on triggerInitialAnalysis before calling init to prevent the automatic run
    const triggerInitialAnalysisSpy = jest
      .spyOn(appController, "triggerInitialAnalysis")
      .mockImplementation(() => Promise.resolve());

    // Initialize the controller. This will set up all the mocked dependencies.
    appController.init("#app");

    // Restore the original implementation so we can test it manually in its own suite
    triggerInitialAnalysisSpy.mockRestore();

    // Mock the heuristic-based container finder for the analysis methods
    jest.spyOn(appController, "_findReportContainer").mockReturnValue(document.createElement("div"));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("triggerInitialAnalysis", () => {
    it("should handle successful analysis", async () => {
      // Now we call the real method
      await appController.triggerInitialAnalysis();

      expect(mockStateManager.setState).toHaveBeenCalledWith({
        isLoading: true,
        messages: [{role: "assistant", content: "您好，我是您的AI分析助手，正在为您分析当前报表..."}],
      });

      // The contextManager instance created in init is the one passed to run
      expect(mockPipeline.run).toHaveBeenCalledWith("请对当前报表进行全面分析", "fake_image_data", appController.contextManager, true);

      expect(mockStateManager.setState).toHaveBeenCalledWith({
        messages: [{role: "assistant", content: "AI response"}],
      });
      expect(mockContextManager.addMessage).toHaveBeenCalledWith("user", "请对当前报表进行全面分析");
      expect(mockContextManager.addMessage).toHaveBeenCalledWith("assistant", "AI response");
      expect(mockStateManager.setState).toHaveBeenLastCalledWith({isLoading: false});
    });

    it("should handle analysis failure", async () => {
      const error = new Error("Analysis failed");
      mockPipeline.run.mockRejectedValue(error);

      await appController.triggerInitialAnalysis();

      expect(mockLogger.error).toHaveBeenCalledWith("Error during initial analysis:", error);
      expect(mockStateManager.setState).toHaveBeenCalledWith({
        messages: [{role: "assistant", content: "抱歉，初始化分析时遇到问题，请稍后重试。"}],
      });
      expect(mockStateManager.setState).toHaveBeenLastCalledWith({isLoading: false});
    });
  });

  describe("handleUserQuery", () => {
    it("should process a valid user query and update state", async () => {
      const userInput = "What are the sales trends?";
      // Setup sequential returns for getState
      mockStateManager.getState
        .mockReturnValueOnce({messages: []}) // Before user message
        .mockReturnValueOnce({messages: [{role: "user", content: userInput}]}); // After user message

      await appController.handleUserQuery(userInput);

      expect(mockStateManager.setState).toHaveBeenCalledWith({
        messages: [{role: "user", content: userInput}],
        isLoading: true,
      });

      expect(mockContextManager.addMessage).toHaveBeenCalledWith("user", userInput);
      expect(mockPipeline.run).toHaveBeenCalledWith(userInput, "fake_image_data", appController.contextManager, false);

      expect(mockStateManager.setState).toHaveBeenCalledWith({
        messages: [
          {role: "user", content: userInput},
          {role: "assistant", content: "AI response"},
        ],
      });
      expect(mockContextManager.addMessage).toHaveBeenCalledWith("assistant", "AI response");
      expect(mockStateManager.setState).toHaveBeenLastCalledWith({isLoading: false});
    });

    it("should handle errors during user query analysis", async () => {
      const userInput = "Tell me something.";
      const error = new Error("Query failed");
      mockPipeline.run.mockRejectedValue(error);
      // Set the state to include the user's message before the error happens
      mockStateManager.getState.mockReturnValue({messages: [{role: "user", content: userInput}]});

      await appController.handleUserQuery(userInput);

      expect(mockLogger.error).toHaveBeenCalledWith("Error occurred while handling user query:", error);
      expect(mockStateManager.setState).toHaveBeenCalledWith({
        messages: [
          {role: "user", content: userInput},
          {role: "assistant", content: "抱歉，分析时遇到问题，请稍后重试。"},
        ],
      });
      expect(mockStateManager.setState).toHaveBeenLastCalledWith({isLoading: false});
    });
  });

  describe("resetAnalysis", () => {
    it("should clear context and trigger a new initial analysis", async () => {
      // We need to spy on the method again for this specific test
      const triggerSpy = jest.spyOn(appController, "triggerInitialAnalysis").mockResolvedValue();

      await appController.resetAnalysis();

      expect(mockContextManager.clear).toHaveBeenCalledTimes(1);
      expect(mockStateManager.setState).toHaveBeenCalledWith({isDataStale: false});
      expect(triggerSpy).toHaveBeenCalledTimes(1);
    });
  });
});
