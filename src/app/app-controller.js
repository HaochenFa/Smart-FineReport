/**
 * @file app-controller.js
 * @author Haochen (Billy) Fa
 * @description The core of AI & Logic layer, use Dependency Injection technique to listen and control
 * @description 逻辑和 AI 层的核心，使用「依赖注入」技巧监听和控制组件
 */

import {StateManager} from "./state-manager.js";
import {UIManager} from "../ui/ui-manager.js";
// import {FRInterface} from "../integration/fr-interface.js";
// import {DataProcessor} from "../integration/data-processor.js";
import {PromptBuilder} from "../core/prompt-builder.js";
import {AIEngine} from "../core/vllm-interface.js";
import {AnalysisPipeline} from "../core/ai-analysis-pipeline.js";
import {Logger} from "../utils/logger.js";
import {ContextManager} from "@/core/context-manager.js";
import html2canvas from "html2canvas";

export default class AppController {
  /**
   * @constructor 导入全局静态配置
   */
  constructor(settings) {
    this.settings = settings; // 保存导入的配置
  }

  /**
   * @function init() - 初始化，按顺序实例化导入的组件
   * @param {string} containerSelector - UI 容器的 DOM 选择器
   */
  init(containerSelector) {
    // 1. 初始化状态管理器，确保 UI 反应
    this.stateManager = new StateManager({
      messages: [],
      isLoading: false,
    });

    // 2. 初始化所有后端的逻辑和 AI 模块
    // 注意实例化顺序
    const promptBuilder = new PromptBuilder();
    const aiEngine = new AIEngine({url: this.settings.service.url});
    this.contextManager = new ContextManager();

    // 3. 整合核心分析管线 ai-analysis-pipeline
    this.pipeline = new AnalysisPipeline(promptBuilder, aiEngine);

    // 4. 初始化 UI 管理器
    this.uiManager = new UIManager(
      containerSelector,
      this.stateManager,
      this.handleUserQuery.bind(this),
      this.resetAnalysis.bind(this)
    );

    // 5. 启动 UI 渲染
    this.uiManager.init();

    // 6. 触发初次分析
    this.triggerInitialAnalysis();

    // 7. 模拟监听帆软报表数据更新事件
    // 在实际集成中，这里应该替换为真实的帆软 API 事件监听器
    setTimeout(() => {
      this.handleReportUpdate();
    }, 30000); // 模拟30秒后数据更新

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
        {role: "assistant", content: "您好，我是您的AI分析助手，正在为您分析当前报表..."},
      ],
    });

    try {
      // 2. 运行分析
      const defaultQuery = "请对当前报表进行全面分析";
      this.contextManager.addMessage("user", defaultQuery);
      const aiResponse = await this.runAnalysis(defaultQuery, true);

      // 3. 更新UI，显示分析结果
      this.stateManager.setState({
        messages: [{role: "assistant", content: aiResponse}],
      });
      this.contextManager.addMessage("assistant", aiResponse);
    } catch (error) {
      Logger.error("Error during initial analysis:", error);
      this.stateManager.setState({
        messages: [{role: "assistant", content: "抱歉，初始化分析时遇到问题，请稍后重试。"}],
      });
    } finally {
      this.stateManager.setState({isLoading: false});
    }
  }

  /**
   * @function resetAnalysis() - 重置分析流程
   */
  async resetAnalysis() {
    this.contextManager.clear();
    this.stateManager.setState({isDataStale: false});
    await this.triggerInitialAnalysis();
  }

  /**
   * @function handleReportUpdate() - 处理报表数据更新事件
   */
  handleReportUpdate() {
    this.stateManager.setState({isDataStale: true});
    Logger.log("Report data has been updated. Notifying user.");
  }

  /**
   * @function runAnalysis() - 运行分析的核心逻辑
   * @param {string} text - 用于分析的文本提示
   * @param {boolean} isInitial - 是否是初始化后的默认分析报告
   * @returns {Promise<string>} - AI的响应
   */
  async runAnalysis(text, isInitial = false) {
    const history = this.contextManager.getFormattedHistory();

    // 截取报表区域的图像
    const reportContainer = document.querySelector(".report-container"); // 请将 '.report-container' 替换为实际的报表容器选择器
    if (!reportContainer) {
      throw new Error("无法找到报表容器，请检查选择器是否正确。");
    }
    const canvas = await html2canvas(reportContainer);
    const imageBase64 = canvas.toDataURL("image/png");

    // 调用核心分析逻辑
    return await this.pipeline.run(text, imageBase64, history, isInitial);
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
      // 1. 更新 UI 状态，显示用户的消息，并进入加载状态
      const currentState = this.stateManager.getState();
      this.stateManager.setState({
        messages: [...currentState.messages, {role: "user", content: text}],
        isLoading: true,
      });

      // 2. 更新对话上下文
      this.contextManager.addMessage("user", text);

      // 3. 调用核心分析逻辑
      const aiResponse = await this.runAnalysis(text, false);

      // 4. 更新上下文和 UI 状态
      this.contextManager.addMessage("assistant", aiResponse);
      const finalState = this.stateManager.getState();
      this.stateManager.setState({
        messages: [...finalState.messages, {role: "assistant", content: aiResponse}],
      });
    } catch (error) {
      // 错误处理：如果 pipeline 分析失败，应当告知用户
      Logger.error("Error occurred while handling user query:", error);
      const errorState = this.stateManager.getState();
      this.stateManager.setState({
        messages: [
          ...errorState.messages,
          {role: "assistant", content: "抱歉，分析时遇到问题，请稍后重试。"},
        ],
      });
    } finally {
      // 无论成功与否，取消加载状态，避免 UI 卡顿
      this.stateManager.setState({isLoading: false});
    }
  }
}
