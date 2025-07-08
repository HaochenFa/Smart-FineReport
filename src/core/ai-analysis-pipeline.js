/**
 * @file ai-analysis-pipeline.js
 * @author Haochen (Billy) Fa
 * @description Organize AI Service 组织并有序调用 AI 服务组件
 *
 * @import ../utils/logger.js
 */

import { Logger as log } from "../utils/logger.js";

export class AnalysisPipeline {
  /**
   * @private
   */
  #promptBuilder;
  #aiEngine;

  /**
   * 通过构造函数注入依赖项。
   * @param {object} promptBuilder - 负责构建Prompt的对象。必须实现 build(userRequest, imageBase64, contextProvider) 方法。
   * @param {object} aiEngine - 负责与AI模型交互的对象。必须实现 async getResponse(prompt) 方法。
   */
  constructor(promptBuilder, aiEngine, uiManager) {
    // Basic validation to ensure dependencies and their methods exist
    if (
      !promptBuilder?.build ||
      !aiEngine?.getResponse ||
      !uiManager?.showAssistantStatus ||
      !uiManager?.hideAssistantStatus
    ) {
      const errorMsg =
        "[AnalysisPipeline] A dependency is missing or does not implement its required method.";
      log.error(errorMsg);
      throw new Error(errorMsg);
    }
    this.#promptBuilder = promptBuilder;
    this.#aiEngine = aiEngine;
    this.uiManager = uiManager;

    log.log("[AnalysisPipeline] Pipeline initialized successfully with all dependencies.");
  }

  /**
   * @description 执行一次从提问到回答的完整分析流程。
   * @param {string} userRequest - 用户的当前问题。
   * @param {string} imageBase64 - 报表截图的 Base64 编码字符串。
   * @param {object} contextProvider - 提供上下文信息的对象, 如对话历史。
   * @param {boolean} isInitial - 判断是否是默认分析报告，或是用户后续交互
   * @returns {Promise<string>} - AI的最终分析结果。
   */
  async run(userRequest, imageBase64, contextProvider, isInitial) {
    log.log(`[AnalysisPipeline] Starting analysis for: "${userRequest}"`);

    try {
      // 步骤 1: 构建最终的 Prompt
      log.log("[AnalysisPipeline] Step 1: Building final prompt with image...");
      this.uiManager.showAssistantStatus("构建提示中...");
      const finalPrompt = this.#promptBuilder.build(
        userRequest,
        imageBase64,
        contextProvider,
        isInitial
      );
      log.log("[AnalysisPipeline] Prompt built successfully.");

      // 步骤 3: 调用 AI 引擎获取响应
      log.log("[AnalysisPipeline] Step 3: Sending prompt to AI engine...");
      this.uiManager.showAssistantStatus("发送数据中...");
      const aiResponse = await this.#aiEngine.getResponse(finalPrompt);
      log.log("[AnalysisPipeline] AI engine returned a response.");
      this.uiManager.showAssistantStatus("解析结果中...");

      // 步骤 4: 返回最终结果
      log.log("[AnalysisPipeline] Analysis finished successfully.");
      this.uiManager.hideAssistantStatus();
      return aiResponse;
    } catch (error) {
      log.error("[AnalysisPipeline] An error occurred during the analysis pipeline:", error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }
}
