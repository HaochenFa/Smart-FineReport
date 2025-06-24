/**
 * @file ai-analysis-pipeline.js
 * @author Haochen (Billy) Fa
 * @description Unit test for src/core/ai-analysis-pipeline.js
 */

import {beforeAll, beforeEach, describe, expect, it, jest} from "@jest/globals";

// Module-level variables to hold the imported modules after mocking.
let AnalysisPipeline;
let PromptBuilder;
let AiEngine;
let Logger;

// ESM-compatible mocking setup. This runs once before all tests in this file.
beforeAll(async () => {
  // 1. Mock the dependencies using Jest's API for ES Modules.
  jest.unstable_mockModule("@/core/prompt-builder.js", () => ({
    // The AnalysisPipeline expects an object with a build method.
    PromptBuilder: {
      build: jest.fn(),
    },
  }));

  jest.unstable_mockModule("@/core/vllm-interface.js", () => ({
    // The AnalysisPipeline expects an object with a getResponse method.
    AiEngine: {
      getResponse: jest.fn(),
    },
  }));

  jest.unstable_mockModule("@/utils/logger.js", () => ({
    Logger: {
      log: jest.fn(),
      error: jest.fn(),
    },
  }));

  // 2. Dynamically import the modules *after* the mocks have been configured.
  const pipelineModule = await import("@/core/ai-analysis-pipeline.js");
  AnalysisPipeline = pipelineModule.AnalysisPipeline;

  const promptBuilderModule = await import("@/core/prompt-builder.js");
  PromptBuilder = promptBuilderModule.PromptBuilder;

  const aiEngineModule = await import("@/core/vllm-interface.js");
  AiEngine = aiEngineModule.AiEngine;

  const loggerModule = await import("@/utils/logger.js");
  Logger = loggerModule.Logger;
});


describe('AnalysisPipeline', () => {

  // Before each test, clear all mock history to ensure a clean state.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize successfully when all dependencies are valid', () => {
      // Action: Instantiate the pipeline with the mocked dependency objects.
      const pipeline = new AnalysisPipeline(PromptBuilder, AiEngine);

      expect(pipeline).toBeInstanceOf(AnalysisPipeline);
      expect(Logger.log).toHaveBeenCalledWith('[AnalysisPipeline] Pipeline initialized successfully with all dependencies.');
    });

    it('should throw an error if a dependency is missing its required method', () => {
      // Setup: Use a plain object that doesn't conform to the contract.
      const invalidPromptBuilder = {};

      // Action & Assertion:
      expect(() => new AnalysisPipeline(invalidPromptBuilder, AiEngine))
        .toThrow('[AnalysisPipeline] A dependency is missing or does not implement its required method.');
      expect(Logger.error).toHaveBeenCalled();
    });
  });

  describe('run', () => {
    it('should execute the pipeline in the correct order on a successful run', async () => {
      // --- Setup ---
      const userRequest = '分析这张图表。';
      const imageBase64 = 'data:image/png;base64,mock-base64-string';
      const contextProvider = {
        getFormattedHistory: jest.fn().mockReturnValue("User: 之前销售额如何？\nAI: 很好。")
      };

      const mockFinalPrompt = '{"type": "multi_modal", "content": [{"type": "text", "text": "..."}, {"type": "image_url", "image_url": {"url": "..."}}]}';
      const mockAiResponse = '这张图表显示了销售额的显著增长。';

      // Configure the mock methods on the imported mock objects.
      PromptBuilder.build.mockReturnValue(mockFinalPrompt);
      AiEngine.getResponse.mockResolvedValue(mockAiResponse);

      // --- Action ---
      const pipeline = new AnalysisPipeline(PromptBuilder, AiEngine);
      const result = await pipeline.run(userRequest, imageBase64, contextProvider);

      // --- Assertions ---
      expect(PromptBuilder.build).toHaveBeenCalledTimes(1);
      expect(PromptBuilder.build).toHaveBeenCalledWith(userRequest, imageBase64, contextProvider);

      expect(AiEngine.getResponse).toHaveBeenCalledTimes(1);
      expect(AiEngine.getResponse).toHaveBeenCalledWith(mockFinalPrompt);

      expect(result).toBe(mockAiResponse);

      expect(Logger.log).toHaveBeenCalledWith(expect.stringContaining('Starting analysis'));
      expect(Logger.log).toHaveBeenCalledWith(expect.stringContaining('Analysis finished successfully'));
    });

    it('should throw an error and stop execution if build fails', async () => {
      // --- Setup ---
      const errorMessage = 'Invalid prompt template.';
      const expectedError = new Error(errorMessage);
      PromptBuilder.build.mockImplementation(() => {
        throw expectedError;
      });

      // --- Action & Assertion ---
      const pipeline = new AnalysisPipeline(PromptBuilder, AiEngine);
      await expect(pipeline.run('any request', 'any-base64', {}))
        .rejects.toThrow(`Analysis failed: ${errorMessage}`);

      expect(AiEngine.getResponse).not.toHaveBeenCalled();
      expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('An error occurred'), expectedError);
    });

    it('should throw an error if getResponse fails', async () => {
      // --- Setup ---
      const errorMessage = 'AI model timeout.';
      const expectedError = new Error(errorMessage);
      PromptBuilder.build.mockReturnValue('a valid prompt');
      AiEngine.getResponse.mockRejectedValue(expectedError);

      // --- Action & Assertion ---
      const pipeline = new AnalysisPipeline(PromptBuilder, AiEngine);
      await expect(pipeline.run('any request', 'any-base64', {}))
        .rejects.toThrow(`Analysis failed: ${errorMessage}`);
      expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('An error occurred'), expectedError);
    });
  });
});