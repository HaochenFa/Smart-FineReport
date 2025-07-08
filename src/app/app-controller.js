/**
 * @file app-controller.js
 * @author Haochen (Billy) Fa
 * @description The core of AI & Logic layer, use Dependency Injection technique to listen and control
 * @description 逻辑和 AI 层的核心，使用「依赖注入」技巧监听和控制组件
 */

import { StateManager } from "./state-manager.js";
import { UIManager } from "../ui/ui-manager.js";
import { PromptBuilder } from "../core/prompt-builder.js";
import { AIEngine } from "../core/vllm-interface.js";
import { AnalysisPipeline } from "../core/ai-analysis-pipeline.js";
import { Logger } from "../utils/logger.js";
import { ContextManager } from "@/core/context-manager.js";
import html2canvas from "html2canvas";
import { marked } from "marked";

export default class AppController {
  /**
   * @constructor 导入全局静态配置
   */
  constructor(serviceUrl) {
    this.serviceUrl = serviceUrl; // 保存后端服务 URL
  }

  /**
   * @function init() - 初始化，按顺序实例化导入的组件
   * @param {string} containerSelector - UI 容器的 DOM 选择器
   */
  init(containerElement) {
    // 1. 初始化状态管理器，确保 UI 反应
    this.stateManager = new StateManager({
      messages: [],
      isLoading: false, // isLoading is now deprecated but kept for safety
    });

    // 2. 初始化所有后端的逻辑和 AI 模块
    // 注意实例化顺序
    const promptBuilder = new PromptBuilder();
    const aiEngine = new AIEngine({ url: this.serviceUrl });
    this.contextManager = new ContextManager();

    if (!containerElement) {
      // fixme)) Cannot initialize
      Logger.error("Initialization failed: Invalid container element provided.");
      return;
    }

    // 3. 初始化 UI 管理器
    this.uiManager = new UIManager(
      containerElement, // 传递 DOM 元素而非选择器字符串
      this.stateManager,
      this.handleUserQuery.bind(this),
      this.resetAnalysis.bind(this)
    );

    // 4. 整合核心分析管线 ai-analysis-pipeline
    this.pipeline = new AnalysisPipeline(promptBuilder, aiEngine, this.uiManager);

    // 5. 启动 UI 渲染
    this.uiManager.init();

    // 6. 触发初次分析
    this.triggerInitialAnalysis();

    Logger.log("AppController Initialized and Ready");
  }

  /**
   * @function triggerInitialAnalysis() - 触发首次自动分析
   */
  async triggerInitialAnalysis() {
    // 1. 设置加载状态并显示欢迎消息
    this.stateManager.setState({
      isLoading: true,
      messages: [
        {
          role: "system",
          content: "您好，我是您的AI分析助手，正在为您分析当前报表...",
          type: "info",
        },
      ],
    });

    try {
      // 2. 运行分析
      const defaultQuery = "请对当前报表进行全面分析";
      this.contextManager.addMessage("user", defaultQuery);
      const aiResponse = await this.runAnalysis(defaultQuery, true);

      // 3. 更新UI，显示分析结果
      this.stateManager.setState({
        messages: [{ role: "assistant", content: aiResponse }],
      });
      this.contextManager.addMessage("assistant", aiResponse);
    } catch (error) {
      Logger.error("Error during initial analysis:", error);
      this.uiManager.hideAssistantStatus(); // 隐藏状态栏
      this.stateManager.setState({
        messages: [{ role: "system", content: this._getErrorMessage(error), type: "error" }],
      });
    } finally {
      this.stateManager.setState({ isLoading: false });
    }
  }

  /**
   * @function resetAnalysis() - 重置分析流程
   */
  async resetAnalysis() {
    this.contextManager.clear();
    this.stateManager.setState({ isDataStale: false });
    await this.triggerInitialAnalysis();
  }

  /**
   * @function handleReportUpdate() - 处理报表数据更新事件
   */
  handleReportUpdate() {
    this.stateManager.setState({ isDataStale: true });
    Logger.log("Report data has been updated. Notifying user.");
  }

  /**
   * @function runAnalysis() - 运行分析的核心逻辑
   * @param {string} text - 用于分析的文本提示
   * @param {boolean} isInitial - 是否是初始化后的默认分析报告
   * @returns {Promise<string>} - AI的响应
   */
  async runAnalysis(text, isInitial = false) {
    // 直接将 contextManager 实例作为 contextProvider 传递
    const reportContainer = this._findReportContainer();

    if (!reportContainer) {
      const errorMsg =
        "Auto-detection failed: Could not find a suitable report container to screenshot.";
      Logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const canvas = await html2canvas(reportContainer);
    const imageBase64 = canvas.toDataURL("image/png");

    // 调用核心分析逻辑，传入 this.contextManager 作为 contextProvider
    this.uiManager.showAssistantStatus("抓取数据中...");
    try {
      const aiResponseMarkdown = await this.pipeline.run(
        text,
        imageBase64,
        this.contextManager,
        isInitial
      );
      this.uiManager.hideAssistantStatus(); // Hide status on success
      const aiResponseHtml = await marked.parse(aiResponseMarkdown); // Parse Markdown to HTML here
      return aiResponseHtml;
    } catch (error) {
      this.uiManager.hideAssistantStatus(); // Hide status on error
      throw error; // Re-throw the error
    }
  }

  /**
   * @function handleUserQuery() - 回调函数传递给 UIManager，当用户提交信息后，负责整合响应流程
   * @param {string} text - 用户输入的文字
   */
  async handleUserQuery(text) {
    // 输入校验
    if (!text || text.trim().length === 0) {
      return;
    }

    try {
      // 1. 更新 UI 状态，立即显示用户的消息，并进入加载状态
      const currentState = this.stateManager.getState();
      const userMessage = { role: "user", content: text };
      this.stateManager.setState({
        messages: [...currentState.messages, userMessage],
        isLoading: true,
      });

      // 2. 更新对话上下文
      this.contextManager.addMessage("user", text);

      // 3. 调用核心分析逻辑
      const aiResponse = await this.runAnalysis(text, false);

      // 4. 更新上下文和 UI 状态，添加 AI 的回复
      this.contextManager.addMessage("assistant", aiResponse);
      const updatedState = this.stateManager.getState();
      const assistantMessage = { role: "assistant", content: aiResponse };
      this.stateManager.setState({
        messages: [...updatedState.messages, assistantMessage],
      });
    } catch (error) {
      // 错误处理：如果 pipeline 分析失败，应当告知用户
      Logger.error("Error occurred while handling user query:", error);
      this.uiManager.hideAssistantStatus(); // 隐藏状态栏
      const errorState = this.stateManager.getState();
      this.stateManager.setState({
        messages: [
          ...errorState.messages,
          { role: "system", content: this._getErrorMessage(error), type: "error" },
        ],
      });
    } finally {
      // 无论成功与否，取消加载状态，避免 UI 卡顿
      this.stateManager.setState({ isLoading: false });
    }
  }

  /**
   * @private
   * @description 根据错误类型返回用户友好的错误消息。
   * @param {Error} error - 捕获到的错误对象。
   * @returns {string} - 用户友好的错误消息。
   */
  _getErrorMessage(error) {
    Logger.error("Original error:", error);
    const errorMessage = error.message || "未知错误";

    // 用户可自行解决的错误
    if (
      errorMessage.includes(
        "Auto-detection failed: Could not find a suitable report container to screenshot."
      )
    ) {
      return "无法自动检测到报表区域。请确保报表已完全加载并可见，或尝试刷新页面。如果问题持续存在，请联系IT支持。";
    } else if (
      errorMessage.includes("All configured vLLM API URLs failed.") ||
      errorMessage.includes("Failed to fetch")
    ) {
      return "网络连接似乎存在问题，或AI服务不可用。请检查您的互联网连接，然后重试。如果问题持续存在，请联系IT支持。";
    } else if (
      errorMessage.includes("Prompt cannot be null, empty, or invalid.") ||
      errorMessage.includes("Prompt is not a valid JSON string.")
    ) {
      return "AI请求参数错误。请尝试使用更简洁的描述，或联系IT支持。";
    } else if (
      errorMessage.includes("Invalid or unexpected response structure from ChatCompletion API.")
    ) {
      return "AI服务返回了异常响应。请稍后重试。如果问题持续存在，请联系IT支持并提供错误详情。";
    }

    // 需要联系 IT 的错误
    return "分析时遇到内部错误。请稍后重试。如果问题持续存在，请联系IT支持并提供错误详情。";
  }

  /**
   * @private
   * @description 启发式查找最大容器的私有方法
   * @return {HTMLElement | null} - 返回找到的元素
   */
  _findReportContainer() {
    Logger.log(
      "`reportSelector` not provided. Attempting to auto-detect the main report container."
    );

    // Rule 1: Search based on common FineReport CSS class names or IDs.
    const candidateSelectors = [
      "body[id=\"body\"]",
      "div[id=\"wrapper\"]",
      "div[class*=\"fr-quick-border-layout\"]",
      "div[id*=\"fr\"]",
      "div[id^=\"content-pane\"]",
    ];

    for (const selector of candidateSelectors) {
      const element = document.querySelector(selector);
      // If a valid, visible element is found, return it immediately.
      if (
        element &&
        element.offsetWidth > 0 &&
        element.offsetHeight > 0 &&
        element.offsetParent !== null
      ) {
        Logger.log(`Found container via candidate selector: '${selector}'`);
        return element;
      }
    }

    // Rule 2: If not found by selector, switch to the "largest area" heuristic.
    // This rule assumes the report body is the largest visible block-level element.
    Logger.log("Candidate selectors failed. Switching to largest-area heuristic.");

    let largestElement = null;
    let maxArea = 0;
    const allDivs = document.body.getElementsByTagName("div");

    for (const div of allDivs) {
      // Check if the element is visible (cross-browser compatible way).
      if (div.offsetWidth > 0 && div.offsetHeight > 0 && div.offsetParent !== null) {
        // Exclude the AI container itself from the search.
        if (this.uiManager && this.uiManager.container && div === this.uiManager.container) {
          continue;
        }

        const area = div.offsetWidth * div.offsetHeight;
        if (area > maxArea) {
          maxArea = area;
          largestElement = div;
        }
      }
    }

    if (largestElement) {
      Logger.log("Found container via largest-area heuristic:", largestElement);
    } else {
      Logger.warn("Auto-detection failed to find a suitable container.");
    }

    return largestElement;
  }
}
