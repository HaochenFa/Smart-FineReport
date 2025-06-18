/**
 * @file ai-analysis-pipeline.js
 * @author Haochen (Billy) Fa
 * @description Organize AI Service 组织并有序调用 AI 服务组件
 *
 * @import ../utils/logger.js
 */

import {Logger as log} from "../utils/logger.js";

export class AnalysisPipeline {
  /**
   * @private
   */
  #dataProcessor;
  #promptBuilder;
  #aiEngine;

  /**
   * 通过构造函数注入依赖项。
   * @param {object} dataProcessor - 负责数据预处理和检索的对象。必须实现 async getStructuredData(widgetConfig) 方法。
   * @param {object} promptBuilder - 负责构建Prompt的对象。必须实现 build(userRequest, structuredData, contextProvider) 方法。
   * @param {object} aiEngine - 负责与AI模型交互的对象。必须实现 async getResponse(prompt) 方法。
   */
  constructor(dataProcessor, promptBuilder, aiEngine) {
    // Basic validation to ensure dependencies and their methods exist
    if (!dataProcessor?.getStructuredData || !promptBuilder?.build || !aiEngine?.getResponse) {
      const errorMsg = "[AnalysisPipeline] A dependency is missing or does not implement its required method.";
      log.error(errorMsg);
      throw new Error(errorMsg);
    }
    this.#dataProcessor = dataProcessor;
    this.#promptBuilder = promptBuilder;
    this.#aiEngine = aiEngine;

    log.log("[AnalysisPipeline] Pipeline initialized successfully with all dependencies.");
  }

  /**
   * @description 执行一次从提问到回答的完整分析流程。
   * @param {string} userRequest - 用户的当前问题。
   * @param {Array<object>} widgetConfig - 用于从帆软等报表工具中提取数据的组件配置。
   * @param {object} contextProvider - 提供上下文信息的对象, 如对话历史。
   * @returns {Promise<string>} - AI的最终分析结果。
   */
  async run(userRequest, widgetConfig, contextProvider) {
    log.log(`[AnalysisPipeline] Starting analysis for: "${userRequest}"`);

    try {
      // 步骤 1: 根据配置，从组件中获取结构化数据
      log.log("[AnalysisPipeline] Step 1: Getting structured data from widgets...");
      const structuredData = await this.#dataProcessor.getStructuredData(widgetConfig);
      log.log("[AnalysisPipeline] Structured data retrieved successfully.");

      // 步骤 2: 构建最终的 Prompt
      log.log("[AnalysisPipeline] Step 2: Building final prompt...");
      const finalPrompt = this.#promptBuilder.build(userRequest, structuredData, contextProvider);
      log.log("[AnalysisPipeline] Prompt built successfully.");

      // 步骤 3: 调用 AI 引擎获取响应
      log.log("[AnalysisPipeline] Step 3: Sending prompt to AI engine...");
      const aiResponse = await this.#aiEngine.getResponse(finalPrompt);
      log.log("[AnalysisPipeline] AI engine returned a response.");

      // 步骤 4: 返回最终结果
      log.log("[AnalysisPipeline] Analysis finished successfully.");
      return aiResponse;

    } catch (error) {
      log.error("[AnalysisPipeline] An error occurred during the analysis pipeline:", error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }
}