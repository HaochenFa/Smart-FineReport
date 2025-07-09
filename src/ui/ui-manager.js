/**
 * @file ui-manager.js
 * @author Haochen (Billy) Fa
 * @description Organizer between ChatView.svelte and state-manager.js
 */

import ChatView from "./ChatView.svelte";
import { Logger } from "../utils/logger.js";

/**
 * UIManager 类负责管理UI的整体逻辑和生命周期。
 */
export class UIManager {
  /**
   * 构造一个 UIManager 实例。
   * @param {HTMLElement} container - UI 将被渲染到的根 DOM 元素。
   * @param {object} stateManager - 状态管理器实例，UI Manager 将订阅其状态更新。
   * @param {function(string): void} messageSubmitHandler - 当用户提交消息时要调用的处理函数。
   * @param {function(): void} resetAnalysisHandler - 当用户点击重置按钮时要调用的处理函数。
   */
  constructor(
    container,
    stateManager,
    messageSubmitHandler,
    resetAnalysisHandler
  ) {
    if (
      !container ||
      !stateManager ||
      typeof messageSubmitHandler !== "function" ||
      typeof resetAnalysisHandler !== "function"
    ) {
      throw new Error("UIManager: 无效的构造函数参数。");
    }

    this.container = container;
    this.stateManager = stateManager;
    this.messageSubmitHandler = messageSubmitHandler;
    this.resetAnalysisHandler = resetAnalysisHandler;
    this.isInitialized = false;

    // 创建 Svelte 组件实例，挂载到指定容器
    // 默认禁用输入，只有在系统完全就绪后才启用
    this.chatViewElement = new ChatView({
      target: this.container,
      props: {
        messages: [],
        isDisabled: true, // 默认禁用，防止在初始化未完成时用户输入
      },
    });

    // 监听组件事件
    this.chatViewElement.$on("submitMessage", async (event) => {
      await this._handleUserSubmit(event.detail);
    });

    this.chatViewElement.$on("resetAnalysis", () => {
      resetAnalysisHandler();
    });

    this._bindToStateChanges();
    // 直接初始化
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const initialState = this.stateManager.getState();
    this._update(initialState);
  }

  disableInputs() {
    if (this.chatViewElement) {
      this.chatViewElement.$set({ isDisabled: true });
    }
  }

  enableInputs() {
    if (this.chatViewElement) {
      this.chatViewElement.$set({ isDisabled: false });
    }
  }

  addUserMessage(userInput) {
    this.stateManager.addMessage({ role: "user", content: userInput });
  }

  showAssistantStatus(statusText) {
    if (this.chatViewElement && this.chatViewElement.showAssistantStatus) {
      this.chatViewElement.showAssistantStatus(statusText);
    }
  }

  hideAssistantStatus() {
    if (this.chatViewElement && this.chatViewElement.hideAssistantStatus) {
      this.chatViewElement.hideAssistantStatus();
    }
  }

  _bindToStateChanges() {
    this.stateManager.subscribe((state) => this._update(state));
  }

  _update(state) {
    if (state.isLoading) {
      this.disableInputs();
    } else {
      this.enableInputs();
    }
    this._updateMessages(state.messages);
    this._updateResetButton(state.isDataStale);
  }

  _updateResetButton(isStale) {
    if (this.chatViewElement && this.chatViewElement.updateResetButton) {
      this.chatViewElement.updateResetButton(isStale);
    }
  }

  async _handleUserSubmit(messageText) {
    // 添加状态检查，防止在未完全初始化时执行操作
    if (
      !this.isInitialized ||
      !this.stateManager ||
      typeof this.messageSubmitHandler !== "function"
    ) {
      Logger.error(
        "UIManager: Cannot submit message - system not properly initialized"
      );
      return;
    }

    try {
      return await this.messageSubmitHandler(messageText);
    } catch (error) {
      Logger.error("UIManager: Error handling user submit:", error);
      // 可以在这里添加用户友好的错误提示
      throw error;
    }
  }

  _updateMessages(messages) {
    if (this.chatViewElement && this.isInitialized) {
      this.chatViewElement.$set({ messages: messages });
    }
  }

  /**
   * 销毁UI管理器，清理所有资源
   */
  destroy() {
    if (this.chatViewElement) {
      try {
        this.chatViewElement.$destroy();
      } catch (error) {
        Logger.error("Error destroying chat view element:", error);
      }
      this.chatViewElement = null;
    }

    this.isInitialized = false;
    this.container = null;
    this.stateManager = null;
    this.messageSubmitHandler = null;
    this.resetAnalysisHandler = null;
  }
}
