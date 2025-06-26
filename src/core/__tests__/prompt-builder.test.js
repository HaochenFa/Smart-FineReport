/**
 * @file prompt-builder.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for src/core/prompt-builder.js
 */

import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";

import {PromptBuilder} from "@/core/prompt-builder.js";
import {Logger as log} from "@/utils/logger.js";
// Import the templates to verify against them
import {INITIAL_ANALYSIS_TEMPLATE, FOLLOW_UP_TEMPLATE} from "@/utils/default-prompt.js";

describe("PromptBuilder", () => {
  let promptBuilder;

  beforeEach(() => {
    promptBuilder = new PromptBuilder();
    jest.spyOn(log, "log").mockImplementation(() => {
    });
    jest.spyOn(log, "warn").mockImplementation(() => {
    });
    jest.spyOn(log, "error").mockImplementation(() => {
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test case for the initial analysis prompt
  it("should use the initial analysis template when isInitial is true", () => {
    const userRequest = "请分析这张截图。";
    const imageBase64 = "data:image/png;base64,mock-base64-string";
    const contextProvider = {
      getHistory: () => [
        {role: "user", content: "之前的对话"},
        {role: "assistant", content: "之前的回答"},
      ],
    };

    // Call build with isInitial = true
    const resultString = promptBuilder.build(userRequest, imageBase64, contextProvider, true);
    const resultJson = JSON.parse(resultString);

    expect(resultJson.messages[0].role).toBe("system");
    expect(resultJson.messages[0].content).toBe(INITIAL_ANALYSIS_TEMPLATE.System);

    // Verify the rest of the structure
    expect(resultJson.messages).toHaveLength(4); // System + History (2) + User Request
    expect(resultJson.messages[1].content).toBe("之前的对话");
    const currentUserMessage = resultJson.messages[3];
    expect(currentUserMessage.role).toBe("user");
    expect(currentUserMessage.content[0].text).toBe(userRequest);
    expect(currentUserMessage.content[1].image_url.url).toBe(imageBase64);
    expect(log.log).toHaveBeenCalledWith("成功构建多模态Prompt。", expect.any(String));
  });

  // Test case for the follow-up prompt
  it("should use the follow-up template when isInitial is false", () => {
    const userRequest = "那关于第二点，详细说明一下。";
    const imageBase64 = "data:image/png;base64,mock-base64-string";
    const contextProvider = {
      getHistory: () => [
        {role: "user", content: "请分析这张截图。"},
        {role: "assistant", content: "分析报告..."},
      ],
    };

    // Call build with isInitial = false
    const resultString = promptBuilder.build(userRequest, imageBase64, contextProvider, false);
    const resultJson = JSON.parse(resultString);

    expect(resultJson.messages[0].role).toBe("system");
    expect(resultJson.messages[0].content).toBe(FOLLOW_UP_TEMPLATE.System);
    expect(resultJson.messages).toHaveLength(4); // System + History (2) + User Request
  });


  it("should handle null contextProvider gracefully", () => {
    const userRequest = "分析图片";
    const imageBase64 = "data:image/png;base64,another-mock-string";

    const resultString = promptBuilder.build(userRequest, imageBase64, null, true);
    const resultJson = JSON.parse(resultString);

    // System + user request
    expect(resultJson.messages).toHaveLength(2);
    expect(resultJson.messages[0].role).toBe("system");

    const messageContent = resultJson.messages[1].content[0].text;
    expect(messageContent).toBe(userRequest);
    expect(log.warn).toHaveBeenCalledWith("No valid contextProvider was provided, conversation history will be empty.");
  });

  it("should handle invalid imageBase64 string by logging a warning", () => {
    const userRequest = "分析";
    const invalidImageBase64 = "not-a-base64-string";

    promptBuilder.build(userRequest, invalidImageBase64, null, true);

    expect(log.warn).toHaveBeenCalledWith("提供的imageBase64字符串无效，可能无法被模型正确解析：", invalidImageBase64);
  });

  it("should return a safe JSON string and log an error if an exception occurs", () => {
    const originalStringify = JSON.stringify;
    JSON.stringify = jest.fn().mockImplementation(() => {
      throw new Error("mock stringify error");
    });

    const result = promptBuilder.build("请求", "data:image/png;base64,valid", null, true);

    expect(result).toBe("{}");
    expect(log.error).toHaveBeenCalledWith("构建多模态Prompt时出错：", expect.any(Error));

    JSON.stringify = originalStringify;
  });

  it("should handle when contextProvider returns invalid history", () => {
    const userRequest = "分析图片";
    const imageBase64 = "data:image/png;base64,mock-string";
    const contextProvider = {
      getHistory: () => "this is not an array" // Invalid history
    };

    const resultString = promptBuilder.build(userRequest, imageBase64, contextProvider, true);
    const resultJson = JSON.parse(resultString);

    // System + user request, history is ignored
    expect(resultJson.messages).toHaveLength(2);
    expect(log.warn).toHaveBeenCalledWith("Context provider returned invalid history format, expected an array of message objects.");
  });
});
