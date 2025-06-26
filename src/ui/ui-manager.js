/**
 * @file ui-manager.js
 * @author Haochen (Billy) Fa
 * @description Organizer between chat-view.js and state-manager.js
 */

import {ChatView} from "./chat-view.js";

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
  constructor(container, stateManager, messageSubmitHandler, resetAnalysisHandler) {
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

    // ChatView 是一个纯粹的视图组件，它接收一个提交回调函数和一个重置回调函数。
    this.view = new ChatView(
      this.container,
      this._handleUserSubmit.bind(this),
      resetAnalysisHandler
    );

    // 绑定状态更新的回调
    this._bindToStateChanges();

    // 初始化UI
    this.init();
  }

  /**
   * @description 初始化UI界面。
   */
  init() {
    // 渲染 ChatView 的基本 DOM 结构
    this.view.render();

    // 使用状态管理器的初始状态来渲染视图的初始内容
    const initialState = this.stateManager.getState();
    this._update(initialState);
  }

  disableInputs() {
    this.view.inputField.disabled = true;
    this.view.sendButton.disabled = true;
    this.view.resetButton.disabled = true;
  }

  enableInputs() {
    this.view.inputField.disabled = false;
    this.view.sendButton.disabled = false;
    this.view.resetButton.disabled = false;
  }

  addUserMessage(userInput) {
    this.stateManager.addMessage({role: "user", content: userInput});
  }

  showProgressTracker() {
    return this.view.createProgressMessage();
  }

  updateProgress(progressElement, allStages, currentStageId) {
    const stagesWithStatus = allStages.map((stage, index) => {
      const currentStageIndex = allStages.findIndex(s => s.id === currentStageId);
      let status = "pending";
      if (index < currentStageIndex) {
        status = "completed";
      } else if (index === currentStageIndex) {
        status = "inprogress";
      }
      return {...stage, status};
    });
    const html = this.view._renderProgressSteps(stagesWithStatus);
    this.view.updateMessage(progressElement, html);
  }

  renderError(progressElement, allStages, error, failedStageId) {
    const stagesWithStatus = allStages.map((stage, index) => {
      const failedIndex = allStages.findIndex(s => s.id === failedStageId);
      let status = "pending";
      if (index < failedIndex) {
        status = "completed";
      } else if (index === failedIndex) {
        status = "failed";
      }
      return {...stage, status};
    });
    const html = this.view._renderProgressSteps(stagesWithStatus);
    const errorHtml = `<div class="text-red-500 mt-2"><p class="font-bold">分析失败:</p><p>${error.message}</p></div>`;
    this.view.updateMessage(progressElement, html + errorHtml);
  }

  /**
   * @private
   * @description 将 UIManager 绑定到 StateManager 的状态更新事件。
   * 当状态发生变化时，StateManager 将调用此处设置的回调函数。
   */
  _bindToStateChanges() {
    // 通过 subscribe 方法订阅状态变更
    this.stateManager.subscribe((state) => this._update(state));
  }

  /**
   * @private
   * @description 根据给定的新状态更新整个UI。
   * @param {object} state - 最新的应用状态对象。
   */
  _update(state) {
    this._updateMessages(state.messages);
    this._updateResetButton(state.isDataStale);
  }

  /**
   * @private
   * @description 更新重置按钮的状态。
   * @param {boolean} isStale - 数据是否已过时。
   */
  _updateResetButton(isStale) {
    this.view.updateResetButton(isStale);
  }

  /**
   * @private
   * @description 处理来自 ChatView 的用户消息提交事件。
   * @param {string} messageText - 用户输入的原始消息文本。
   */
  _handleUserSubmit(messageText) {
    // 调用外部传入的处理函数，将用户输入的消息传递出去
    this.messageSubmitHandler(messageText);
    // 清空视图中的输入框
    this.view.clearInput();
  }

  /**
   * @private
   * @description 根据最新的消息列表更新聊天窗口。
   * 这是一个“全量更新”的实现，确保视图和状态的完全同步。
   * @param {Array<{role: string, content: string}>} messages - 最新的完整消息列表。
   */
  _updateMessages(messages) {
    // 首先清空当前的消息容器
    // 直接操作 messageContainer 是因为 ChatView 没有提供清空消息的接口
    this.view.messageContainer.innerHTML = "";

    // 遍历所有消息并逐条添加到视图中
    if (messages && Array.isArray(messages)) {
      messages.forEach((message) => {
        this.view.addMessage(message);
      });
    }
  }
}
