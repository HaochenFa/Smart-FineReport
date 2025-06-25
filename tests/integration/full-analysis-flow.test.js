/**
 * @file full-analysis-flow.test.js
 * @author Haochen (Billy) Fa
 * @description Integration test
 */

import {jest, beforeEach, afterEach, describe, it, expect} from "@jest/globals";

// 导入所有需要参与集成的真实模块
import {AnalysisPipeline} from "@/core/ai-analysis-pipeline.js";
import {AIEngine} from "@/core/vllm-interface.js";
import {PromptBuilder} from "@/core/prompt-builder.js";
import {SETTINGS} from "@/utils/settings.js";

// 导入需要被模拟的边界模块
import {APIService} from "@/services/api-service.js";

describe("Full Analysis Flow Integration Test", () => {
  let mockAIResponse;
  let mockImageBase64;

  // 在每个测试用例开始前，准备好所有模拟数据
  beforeEach(() => {
    // 准备模拟的截图数据
    mockImageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    // 准备模拟的AI响应
    mockAIResponse = "分析结论：根据截图内容，西部地区的销售额最高。";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should process a user query with an image and return a mock AI response successfully", async () => {
    // 1. Arrange (装配)

    // 模拟APIService.post，使其返回一个符合ChatCompletion API格式的响应
    const apiServiceSpy = jest.spyOn(APIService, "post").mockResolvedValue({
      choices: [{message: {content: mockAIResponse}}],
    });

    // 创建所有真实模块的实例
    const promptBuilder = new PromptBuilder();
    const aiEngine = new AIEngine(SETTINGS.service);

    // 装配最终的被测对象：AnalysisPipeline
    const pipeline = new AnalysisPipeline(promptBuilder, aiEngine);

    // 2. Act (执行)

    const userQuery = "哪个地区的销售额最高？";
    const result = await pipeline.run(userQuery, mockImageBase64, null); // contextProvider is null for this test

    // 3. Assert (断言)

    expect(result).toBe(mockAIResponse);

    // 验证APIService.post被正确调用
    expect(apiServiceSpy).toHaveBeenCalledTimes(1);

    // 深入验证传递给APIService.post的请求体结构是否正确
    const requestBodySentToAI = apiServiceSpy.mock.calls[0][1];
    expect(requestBodySentToAI.model).toBeDefined();
    expect(requestBodySentToAI.messages).toHaveLength(2);

    const systemMessage = requestBodySentToAI.messages[0];
    expect(systemMessage.role).toBe("system");

    const userMessage = requestBodySentToAI.messages[1];
    expect(userMessage.role).toBe("user");
    expect(userMessage.content).toHaveLength(2);

    const textPart = userMessage.content.find(p => p.type === "text");
    const imagePart = userMessage.content.find(p => p.type === "image_url");

    expect(textPart.text).toBe(userQuery);
    expect(imagePart.image_url.url).toBe(mockImageBase64);
  });
});
