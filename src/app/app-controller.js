/**
 * @file app-controller.js
 * @author Haochen (Billy) Fa
 * @description 逻辑和 AI 层的核心，使用「依赖注入」技巧监听和控制组件
 */

import {StateManager} from "./state-manager.js";
import {UIManager} from "../ui/ui-manager.js";
import {FRInterface} from "../integration/fr-interface.js";
import {DataProcessor} from "../integration/data-processor.js";
import {PromptBuilder} from "../core/prompt-builder.js";
import {AIEngine} from "../core/vllm-interface.js";
import {AnalysisPipeline} from "../core/ai-analysis-pipeline.js";
import {Logger} from '../utils/logger.js';
import {ContextManager} from "@/core/context-manager.js";

class AppController {
  /**
   * @constructor 导入全局静态配置
   */
  constructor(settings) {
    this.settings = settings; // 保存导入的配置
  }

  /**
   * @function init() - 初始化，按顺序实例化导入的组件
   * @param {string} containerSelector - UI 容器的 DOM 选择器
   * @param {object} frInstance - 从帆软环境传入的全局实例
   */
  init(containerSelector, frInstance) {
    // 1. 初始化状态管理器，确保 UI 反应
    this.stateManager = new StateManager({
      messages: [],
      isLoading: false,
    });

    // 2. 初始化所有后端的逻辑和 AI 模块
    // 注意实例化顺序
    const frInterface = new FRInterface(frInstance);
    const dataProcessor = new DataProcessor(frInterface);
    const promptBuilder = new PromptBuilder();
    const aiEngine = new AIEngine(this.settings.service);
    this.contextManager = new ContextManager();

    // 3. 整合核心分析管线 ai-analysis-pipeline
    this.pipeline = new AnalysisPipeline(dataProcessor, promptBuilder, aiEngine);

    // 4. 初始化 UI 管理器
    this.uiManager = new UIManager(
      containerSelector,
      this.stateManager,
      this.handleUserQuery.bind(this),
    );

    // 5. 启动 UI 渲染
    this.uiManager.init();

    Logger.log("AppController Initialized and Ready");
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
      const history = this.contextManager.getFormattedHistory();

      // 3. 调用核心分析逻辑
      const aiResponse = await this.pipeline.run(text, window.FR, history);

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
        messages: [...errorState.messages, {role: "assistant", content: "抱歉，分析时遇到问题，请稍后重试。"}],
      });
    } finally {
      // 无论成功与否，取消加载状态，避免 UI 卡顿
      this.stateManager.setState({isLoading: false});
    }
  }
}

export default new AppController();
