/**
 * @file prompt-builder.js
 * @author Haochen (Billy) Fa
 * @description Fill in Data and Context based on Default Template 填充数据和上下文
 * 使用默认 JSON 模板，将动态数据（包括结构化的数据对象）深度填充，生成一个序列化为 JSON 字符串的提示词
 *
 * @import ../utils/default-prompt.js
 * @import ../utils/logger.js
 */

import {DEFAULT_PROMPT_TEMPLATE} from "../utils/default-prompt.js";
import {Logger as log} from "../utils/logger.js";

export class PromptBuilder {
  /**
   * @description 构建最终的Prompt字符串。
   * @param {string} userRequest - 用户的当前问题。
   * @param {object} structuredData - 结构化的数据对象。
   * @param {object} contextProvider - 一个遵循上下文提供者“契约”的对象。
   * @property {function(): string} contextProvider.getFormattedHistory - 该对象必须包含一个用于获取格式化历史记录的方法。
   * @returns {string} - 准备发送给AI的、序列化为JSON字符串的完整Prompt。
   */
  build(userRequest, structuredData, contextProvider) {
    log.log("开始构建Prompt，接收到的数据：", {
      userRequest,
      structuredData,
      // 通过检查方法是否存在（鸭子类型）来判断是否提供了有效的上下文提供者
      history: (contextProvider && typeof contextProvider.getFormattedHistory === 'function')
        ? "有效的上下文提供者已提供"
        : "未提供有效的上下文提供者",
    });

    try {
      // 步骤 1: 创建模板的深拷贝
      const finalPrompt = JSON.parse(JSON.stringify(DEFAULT_PROMPT_TEMPLATE));

      // 步骤 2: 填充动态数据和上下文
      finalPrompt.Header.TimeStamp = new Date().toISOString();
      finalPrompt.User = userRequest || "";

      // 根据契约（contract）使用传入的上下文提供者
      if (contextProvider && typeof contextProvider.getFormattedHistory === 'function') {
        finalPrompt.Context = contextProvider.getFormattedHistory();
      } else {
        finalPrompt.Context = "";
        log.warn("未提供有效的上下文提供者 (contextProvider)，上下文将为空。");
      }

      // 步骤 3: 填充结构化数据，并处理不匹配的数据
      if (structuredData && typeof structuredData === 'object') {
        const dataKeys = Object.keys(finalPrompt.Data);
        const structuredDataKeys = Object.keys(structuredData);
        const matchedStructuredDataKeys = new Set();

        dataKeys.forEach(templateKey => {
          const matchingDataKey = structuredDataKeys.find(
            dataKey => dataKey.toLowerCase() === templateKey.toLowerCase()
          );

          if (matchingDataKey) {
            finalPrompt.Data[templateKey] = structuredData[matchingDataKey];
            matchedStructuredDataKeys.add(matchingDataKey);
          } else {
            finalPrompt.Data[templateKey] = "";
          }
        });

        const unmatchedKeys = structuredDataKeys.filter(key => !matchedStructuredDataKeys.has(key));
        if (unmatchedKeys.length > 0) {
          log.warn("发现未匹配的数据键，将作为备用数据追加到DashBoard中：", unmatchedKeys);
          const unmatchedDataObject = {};
          unmatchedKeys.forEach(key => {
            unmatchedDataObject[key] = structuredData[key];
          });
          const fallbackString = JSON.stringify({uncategorizedData: unmatchedDataObject}, null, 2);
          const separator = "\n\n// --- 额外的未分类数据 ---\n";
          finalPrompt.Data.DashBoard = (finalPrompt.Data.DashBoard ? finalPrompt.Data.DashBoard : "") + separator + fallbackString;
        }

      } else {
        Object.keys(finalPrompt.Data).forEach(key => {
          finalPrompt.Data[key] = "";
        });
        log.warn("structuredData不是一个有效的对象，所有数据字段将为空。", structuredData);
      }

      // 步骤 4: 序列化为JSON字符串
      const promptString = JSON.stringify(finalPrompt, null, 2);
      log.log("成功构建最终的Prompt字符串。");

      return promptString;

    } catch (error) {
      log.error("构建Prompt字符串时出错：", error);
      return "{}"; // 返回一个空的JSON对象字符串作为安全备用
    }
  }
}
