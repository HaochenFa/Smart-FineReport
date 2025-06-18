/**
 * @file prompt-builder.js
 * @author Haochen (Billy) Fa
 * @description Fill in Data and Context based on Default Template 填充数据和上下文
 * 使用默认 JSON 模板，将动态数据（包括结构化的数据对象）深度填充，生成一个序列化为 JSON 字符串的提示词
 *
 * @import ../utils/default-prompt.js
 * @import ../utils/logger.js
 * @import ./ContextManager.js
 */

import {DEFAULT_PROMPT_TEMPLATE} from "../utils/default-prompt.js";
import {Logger as log} from "../utils/logger.js";
import {ContextManager} from "./context-manager.js";

export class PromptBuilder {
  /**
   * @description 构建最终的Prompt字符串。
   * @param {string} userRequest - 用户的当前问题。
   * @param {object} structuredData - 从ReportDataProvider获取的结构化数据对象。
   * @param {ContextManager} contextManager - 管理对话历史的上下文管理器实例。
   * @returns {string} - 准备发送给AI的、序列化为JSON字符串的完整Prompt。
   */
  build(userRequest, structuredData, contextManager) {
    log.log("Starting to build prompt with received data:", {
      userRequest,
      structuredData,
      history: contextManager instanceof ContextManager ? "ContextManager instance provided" : "No valid ContextManager",
    });

    try {
      // 步骤 1: 创建模板的深拷贝
      const finalPrompt = JSON.parse(JSON.stringify(DEFAULT_PROMPT_TEMPLATE));

      // 步骤 2: 填充动态数据和上下文
      finalPrompt.Header.TimeStamp = new Date().toISOString();
      finalPrompt.User = userRequest || "";
      // 从 ContextManager 获取格式化后的历史记录
      finalPrompt.Context = (contextManager instanceof ContextManager)
        ? contextManager.getFormattedHistory()
        : "";
      if (!(contextManager instanceof ContextManager)) {
        log.warn("A valid ContextManager instance was not provided. Context will be empty.");
      }

      // 步骤 3: 填充结构化数据，并处理不匹配的数据
      if (structuredData && typeof structuredData === 'object') {
        const dataKeys = Object.keys(finalPrompt.Data); // 模板中预设的键
        const structuredDataKeys = Object.keys(structuredData); // 实际数据中的键
        const matchedStructuredDataKeys = new Set(); // 记录已匹配的实际数据键

        // 优先填充预设的键
        dataKeys.forEach(templateKey => {
          const matchingDataKey = structuredDataKeys.find(
            dataKey => dataKey.toLowerCase() === templateKey.toLowerCase()
          );

          if (matchingDataKey) {
            finalPrompt.Data[templateKey] = structuredData[matchingDataKey];
            matchedStructuredDataKeys.add(matchingDataKey); // 标记为已匹配
          } else {
            finalPrompt.Data[templateKey] = ""; // 若无匹配，则设为空
          }
        });

        // **备选方案 (Fallback Logic)**
        // 查找所有未被匹配的实际数据键
        const unmatchedKeys = structuredDataKeys.filter(key => !matchedStructuredDataKeys.has(key));

        if (unmatchedKeys.length > 0) {
          log.warn("Found unmatched data keys, appending to DashBoard as fallback:", unmatchedKeys);
          const unmatchedDataObject = {};
          unmatchedKeys.forEach(key => {
            unmatchedDataObject[key] = structuredData[key];
          });

          // 将未匹配的数据打包成一个清晰的JSON字符串
          const fallbackString = JSON.stringify({uncategorizedData: unmatchedDataObject}, null, 2);

          // 将备选数据追加到DashBoard字段，并用注释明确分隔
          const separator = "\n\n// --- Additional Uncategorized Data ---\n";
          finalPrompt.Data.DashBoard = (finalPrompt.Data.DashBoard ? finalPrompt.Data.DashBoard : "") + separator + fallbackString;
        }

      } else {
        Object.keys(finalPrompt.Data).forEach(key => {
          finalPrompt.Data[key] = "";
        });
        log.warn("structuredData is not a valid object. All data fields will be empty.", structuredData);
      }


      // 步骤 4: 序列化为JSON字符串
      const promptString = JSON.stringify(finalPrompt, null, 2);
      log.log("Successfully built the final prompt string.");

      return promptString;

    } catch (error) {
      log.error("Failed to build prompt string due to an error:", error);
      return "{}";
    }
  }
}
