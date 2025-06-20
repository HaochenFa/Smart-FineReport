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
import {DataProcessor} from "@/integration/data-processor.js";
import {SETTINGS} from "@/utils/settings.js";

// 导入需要被模拟的边界模块
import {FRInterface} from "@/integration/fr-interface.js";
import {APIService} from "@/services/api-service.js";

describe("Full Analysis Flow Integration Test", () => {
  // let mockFRInterface;
  let mockFRData;
  let mockAIResponse;

  // 在每个测试用例开始前，准备好所有模拟数据和模拟模块
  beforeEach(() => {
    // 准备模拟的帆软数据
    mockFRData = {
      Table: [
        ["Region", "Sales"],
        ["East", "1500"],
        ["West", "2200"],
      ],
      Chart: {type: "pie", title: "Sales Distribution"},
      CrossTable: null,
      DashBoard: null,
      Map: null,
    };

    // 准备模拟的AI响应
    mockAIResponse = "分析结论：西部地区的销售额最高。";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should process a user query and return a mock AI response successfully", async () => {
    // 1. Arrange (装配)

    // 这是一种与ESM兼容的、更现代的模拟方式。
    const apiServiceSpy = jest.spyOn(APIService, "post").mockResolvedValue({
      choices: [{text: mockAIResponse}],
    });

    const mockFRInstance = {
      Report: {
        getWidgetByName: jest.fn(),
      },
    };
    const frInterface = new FRInterface(mockFRInstance);

    // 创建所有真实模块的实例
    const dataProvider = new DataProcessor(frInterface);

    jest.spyOn(dataProvider, "getStructuredData").mockResolvedValue(mockFRData);

    const promptBuilder = new PromptBuilder();
    const aiEngine = new AIEngine(SETTINGS.service);

    // 装配最终的被测对象：AnalysisPipeline
    const pipeline = new AnalysisPipeline(dataProvider, promptBuilder, aiEngine);

    // 2. Act (执行)

    const userQuery = "哪个地区的销售额最高？";
    const widgetConfig = [
      {
        key: "sales_data",
        name: "sales_table",
        type: "table",
      },
    ];
    const result = await pipeline.run(userQuery, widgetConfig, "无历史记录");

    // 3. Assert (断言)

    expect(result).toBe(mockAIResponse);

    // 验证被spy的方法被正确调用
    expect(apiServiceSpy).toHaveBeenCalledTimes(1);
    expect(dataProvider.getStructuredData).toHaveBeenCalledWith(widgetConfig);

    // 深入验证传递给APIService.post的Prompt结构是否正确
    const promptSentToAI = JSON.parse(apiServiceSpy.mock.calls[0][1].prompt);

    expect(promptSentToAI.System).toBeDefined();
    expect(promptSentToAI.User).toBe(userQuery);

    expect(promptSentToAI.Data.Table).toEqual(mockFRData.Table);
    expect(promptSentToAI.Data.Chart).toEqual(mockFRData.Chart);
  });
});
