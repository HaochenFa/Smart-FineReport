/**
 * @file prompt-builder.js
 * @author Haochen (Billy) Fa
 * @description Fill in Data and Context based on Default Template 填充数据和上下文
 * 使用默认 JSON 模板，将动态数据（包括结构化的数据对象）深度填充，生成一个序列化为 JSON 字符串的提示词
 *
 * @import ../utils/default-prompt.js
 * @import ../utils/logger.js
 */

import {
  INITIAL_ANALYSIS_TEMPLATE,
  FOLLOW_UP_TEMPLATE,
} from "../utils/default-prompt.js";
import { Logger as log } from "../utils/logger.js";

export class PromptBuilder {
  /**
   * @description 构建最终的Prompt字符串。
   * @param {string} userRequest - 用户的当前问题。
   * @param {string} imageBase64 - 报表截图的 Base64 编码字符串。
   * @param {object} contextProvider - 一个遵循上下文提供者“契约”的对象。
   * @property {function(): string} contextProvider.getFormattedHistory - 该对象必须包含一个用于获取格式化历史记录的方法。
   * @param {boolean} isInitial - 判断是否为初始化后的默认分析报告，抑或是后续的用户交互
   * @returns {string} - 准备发送给AI的、序列化为JSON字符串的完整Prompt。
   */
  build(userRequest, imageBase64, contextProvider, isInitial = true) {
    log.log("开始构建多模态Prompt", { userRequest });

    try {
      // 步骤 1: 获取对话历史
      let history = [];
      if (contextProvider && typeof contextProvider.getHistory === "function") {
        // 调用 getHistory() 获取原始消息数组
        const rawHistory = contextProvider.getHistory();
        if (Array.isArray(rawHistory)) {
          history = rawHistory;
        } else {
          log.warn(
            "Context provider returned invalid history format, expected an array of message objects."
          );
        }
      } else {
        log.warn(
          "No valid contextProvider was provided, conversation history will be empty."
        );
      }

      // 步骤 1.5: 验证 Base64 字符串
      if (
        typeof imageBase64 !== "string" ||
        !imageBase64.startsWith("data:image/")
      ) {
        log.warn(
          "提供的imageBase64字符串无效，可能无法被模型正确解析：",
          imageBase64
        );
      }

      // 根据 isInitial 标志选择系统预设
      const systemPrompt = isInitial
        ? INITIAL_ANALYSIS_TEMPLATE.System
        : FOLLOW_UP_TEMPLATE.System;

      // 步骤 2: 构建多模态消息结构
      const messages = [
        // Add the system prompt first
        {
          role: "system",
          content: systemPrompt,
        },
        ...history,
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userRequest,
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ];

      // 步骤 3: 构建最终的请求体
      const finalPayload = {
        messages: messages,
      };

      // 步骤 4: 序列化为JSON字符串
      const promptString = JSON.stringify(finalPayload, null, 2);
      log.log("成功构建多模态Prompt。", promptString);

      return promptString;
    } catch (error) {
      log.error("构建多模态Prompt时出错：", error);
      return "{}"; // 返回一个空的JSON对象字符串作为安全备用
    }
  }
}
