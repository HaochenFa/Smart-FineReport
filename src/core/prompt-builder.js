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
   * @param {string} imageBase64 - 报表截图的 Base64 编码字符串。
   * @param {object} contextProvider - 一个遵循上下文提供者“契约”的对象。
   * @property {function(): string} contextProvider.getFormattedHistory - 该对象必须包含一个用于获取格式化历史记录的方法。
   * @returns {string} - 准备发送给AI的、序列化为JSON字符串的完整Prompt。
   */
  build(userRequest, imageBase64, contextProvider) {
    log.log("开始构建多模态Prompt", {userRequest});

    try {
      // 步骤 1: 获取对话历史
      let history = [];
      if (contextProvider && typeof contextProvider.getFormattedHistory === "function") {
        const formattedHistory = contextProvider.getFormattedHistory();
        if (Array.isArray(formattedHistory)) {
          history = formattedHistory;
        } else {
          log.warn("上下文提供者返回的历史记录格式无效，期望是消息对象数组。");
        }
      } else {
        log.warn("未提供有效的上下文提供者 (contextProvider)，历史对话将为空。");
      }

      // 步骤 1.5: 验证 Base64 字符串
      if (typeof imageBase64 !== "string" || !imageBase64.startsWith("data:image/")) {
        log.warn("提供的imageBase64字符串无效，可能无法被模型正确解析：", imageBase64);
      }

      // 步骤 2: 构建多模态消息结构
      const messages = [
        // Add the system prompt first
        {
          role: "system",
          content: DEFAULT_PROMPT_TEMPLATE.System,
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
        model: "llava-hf/llava-1.5-7b-hf", // 与测试用例保持一致
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
