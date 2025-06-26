/**
 * @file app-controller.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for app-controller.js, focusing on orchestration logic.
 */

import {jest, describe, it, expect, beforeAll, beforeEach, afterEach} from "@jest/globals";

// --- Mocking all dependencies ---
const mockStateManager = {
  setState: jest.fn(),
  getState: jest.fn(() => ({messages: []})),
};

// A more flexible mock for UIManager that correctly captures the container
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

const mockHtml2canvas = jest.fn();
const mockLogger = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.unstable_mockModule("@/app/state-manager.js", () => ({StateManager: jest.fn(() => mockStateManager)}));
jest.unstable_mockModule("@/ui/ui-manager.js", () => ({
  UIManager: jest.fn((containerElement) => {
    mockUiManagerInstance.container = containerElement;
    return mockUiManagerInstance;
  }),
}));
jest.unstable_mockModule("@/core/ai-analysis-pipeline.js", () => ({AnalysisPipeline: jest.fn(() => mockPipeline)}));
jest.unstable_mockModule("@/core/context-manager.js", () => ({ContextManager: jest.fn(() => mockContextManager)}));
jest.unstable_mockModule("html2canvas", () => ({default: mockHtml2canvas}));
jest.unstable_mockModule("@/utils/logger.js", () => ({Logger: mockLogger}));

// --- Test Suite ---
describe("AppController Orchestration", () => {
  let AppController;
  let appController;
  let Logger;

  // Helper to make an element "visible" in JSDOM for area calculations
  const makeVisible = (element, width, height) => {
    if (!element) return;
    Object.defineProperty(element, "offsetWidth", {configurable: true, value: width});
    Object.defineProperty(element, "offsetHeight", {configurable: true, value: height});
    Object.defineProperty(element, "offsetParent", {configurable: true, value: document.body});
  };

  beforeAll(async () => {
    const appControllerModule = await import("@/app/app-controller.js");
    AppController = appControllerModule.default;
    const loggerModule = await import("@/utils/logger.js");
    Logger = loggerModule.Logger;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "<div id=\"app\"></div>"; // Reset DOM for each test
    mockHtml2canvas.mockResolvedValue({toDataURL: () => "fake_image_data"});
    appController = new AppController("http://fake.url");
    // Reset the container for each test to ensure isolation
    mockUiManagerInstance.container = null;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Initialization", () => {
    it("should call triggerInitialAnalysis on init", () => {
      const triggerSpy = jest.spyOn(appController, "triggerInitialAnalysis").mockResolvedValue();
      appController.init("#app");
      expect(triggerSpy).toHaveBeenCalledTimes(1);
    });

    it("should log an error and return if the container is not found", () => {
      appController.init("#non-existent-container");
      expect(Logger.error).toHaveBeenCalledWith("Initialization failed: Container with selector \"#non-existent-container\" not found.");
      expect(mockUiManagerInstance.init).not.toHaveBeenCalled();
    });
  });

  describe("User-Triggered Analysis (handleUserQuery)", () => {
    beforeEach(() => {
      jest.spyOn(appController, "triggerInitialAnalysis").mockResolvedValue();
      appController.init("#app");
    });

    it("should not run analysis for empty or whitespace-only queries", async () => {
      await appController.handleUserQuery("");
      await appController.handleUserQuery("   ");
      expect(mockPipeline.run).not.toHaveBeenCalled();
    });
  });

  describe("runAnalysis", () => {
    it("should throw an error if the report container cannot be found", async () => {
      jest.spyOn(appController, "_findReportContainer").mockReturnValue(null);
      appController.init("#app");

      await expect(appController.runAnalysis("test")).rejects.toThrow("Auto-detection failed: Could not find a suitable report container to screenshot.");
    });
  });

  describe("_findReportContainer Heuristics", () => {
    it("should find the container using candidate selectors", () => {
      document.body.innerHTML = "<div id=\"wrapper\">Report Content</div><div id=\"app\"></div>";
      const wrapperElement = document.getElementById("wrapper");
      makeVisible(wrapperElement, 200, 200); // Make the element visible

      appController.init("#app");
      const foundElement = appController._findReportContainer();
      expect(foundElement).not.toBeNull();
      expect(foundElement.id).toBe("wrapper");
    });

    it("should find the largest element by area if selectors fail", () => {
      document.body.innerHTML = `
            <div id="app"></div>
            <div id="small">Small</div>
            <div id="largest">Large</div>
        `;
      appController.init("#app"); // Initialize to set uiManager
      makeVisible(document.getElementById("app"), 10, 10);
      makeVisible(document.getElementById("small"), 100, 100);
      makeVisible(document.getElementById("largest"), 200, 200);

      const foundElement = appController._findReportContainer();
      expect(foundElement.id).toBe("largest");
    });

    it("should ignore the AI container when finding the largest element", () => {
      document.body.innerHTML = `
            <div id="app"></div>
            <div id="second-largest">Report</div>
            <div id="small">Small</div>
        `;
      appController.init("#app"); // Initialize to set uiManager and its container

      makeVisible(document.getElementById("app"), 300, 300);
      makeVisible(document.getElementById("second-largest"), 200, 200);
      makeVisible(document.getElementById("small"), 100, 100);

      const foundElement = appController._findReportContainer();
      expect(foundElement.id).toBe("second-largest");
    });

    it("should return null if no suitable visible container is found", () => {
      document.body.innerHTML = "<div id=\"app\"></div>";
      appController.init("#app");
      makeVisible(document.getElementById("app"), 0, 0); // Make it invisible

      const foundElement = appController._findReportContainer();
      expect(foundElement).toBeNull();
    });
  });
});