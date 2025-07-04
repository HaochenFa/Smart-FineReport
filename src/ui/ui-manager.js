/**
 * @file ui-manager.js
 * @author Haochen (Billy) Fa
 * @description Organizer between chat-view.js and state-manager.js
 */

/** @type {CustomElementConstructor} */
import ChatView from "./ChatView.svelte";

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

    // 定义自定义元素 (如果尚未定义)
    if (!customElements.get("chat-view")) {
      customElements.define("chat-view", ChatView);
    }
    this.chatViewElement = document.createElement("chat-view");
    this.container.appendChild(this.chatViewElement);

    this.chatViewElement.addEventListener("submitMessage", async (event) => {
      await this._handleUserSubmit(event.detail);
    });
    this.chatViewElement.addEventListener("resetAnalysis", () => {
      resetAnalysisHandler();
    });

    this._bindToStateChanges();
    this.init();
  }

  init() {
    const initialState = this.stateManager.getState();
    this._update(initialState);
  }

  disableInputs() {
    this.chatViewElement.isDisabled = true;
  }

  enableInputs() {
    this.chatViewElement.isDisabled = false;
  }

  addUserMessage(userInput) {
    this.stateManager.addMessage({role: "user", content: userInput});
  }

  showAssistantStatus(statusText) {
    this.chatViewElement.showAssistantStatus(statusText);
  }

  hideAssistantStatus() {
    this.chatViewElement.hideAssistantStatus();
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
    this.chatViewElement.updateResetButton(isStale);
  }

  async _handleUserSubmit(messageText) {
    await this.messageSubmitHandler(messageText);
  }

  _updateMessages(messages) {
    this.chatViewElement.messages = messages;
  }
}
