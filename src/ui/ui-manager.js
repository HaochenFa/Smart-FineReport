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

    this.view = new ChatView(
      this.container,
      this._handleUserSubmit.bind(this),
      resetAnalysisHandler
    );

    this._bindToStateChanges();
    this.init();
  }

  init() {
    this.view.render();
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

  showAssistantStatus(statusText) {
    this.view.showAssistantStatus(statusText);
  }

  hideAssistantStatus() {
    this.view.hideAssistantStatus();
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
    this.view.updateResetButton(isStale);
  }

  async _handleUserSubmit(messageText) {
    this.view.clearInput();
    await this.messageSubmitHandler(messageText);
  }

  async _updateMessages(messages) {
    this.view.messageContainer.innerHTML = "";
    if (messages && Array.isArray(messages)) {
      
      await Promise.all(messages.map(async message => await this.view.addMessage(message)));
    }
  }
}

