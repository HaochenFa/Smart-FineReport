/**
 * @file chat-view.js
 * @author Haochen (Billy) Fa
 * @description UI Layer, organize DOM elements 纯粹 UI 视图层，管理 DOM 元素
 */

export class ChatView {
  /**
   * @param {HTMLElement} container - UI将被渲染到的容器元素。
   * @param {function} onSubmit - 当用户提交输入时的回调函数。
   * @param {function} onReset - 当用户点击重置按钮时的回调函数。
   */
  constructor(container, onSubmit, onReset) {
    this.container = container;
    this.onSubmit = onSubmit; // 用户提交消息时的回调函数
    this.onReset = onReset; // 用户点击重置时的回调函数

    // 创建UI元素
    this.chatWindow = document.createElement("div"); // 聊天窗口主容器
    this.chatWindow.className =
      "flex flex-col h-full bg-gray-50 rounded-lg shadow-md overflow-hidden";

    this.messageContainer = document.createElement("div"); // 消息显示区域
    this.messageContainer.className = "flex-1 overflow-y-auto p-4 space-y-4";
    this.messageContainer.id = "message-container";

    this.inputArea = document.createElement("div"); // 输入区域
    this.inputArea.className = "flex items-center p-4 border-t border-gray-200 bg-white";

    this.inputField = document.createElement("textarea"); // 文本输入框
    this.inputField.className =
      "flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none h-12 overflow-hidden";
    this.inputField.placeholder = "输入你的消息...";
    this.inputField.rows = 1;
    this.inputField.addEventListener("input", this._autoResizeInput.bind(this)); // 自动调整输入框高度
    this.inputField.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        // 回车发送，Shift+回车换行
        e.preventDefault();
        this._handleSubmit();
      }
    });

    this.sendButton = document.createElement("button"); // 发送按钮
    this.sendButton.className =
      "ml-3 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200";
    this.sendButton.textContent = "发送";
    this.sendButton.addEventListener("click", this._handleSubmit.bind(this));

    this.resetButton = document.createElement("button"); // 重置按钮
    this.resetButton.className =
      "ml-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-200 relative";
    this.resetButton.innerHTML = "重置"; // 使用 innerHTML 以便可以添加提示点
    this.resetButton.addEventListener("click", this._handleReset.bind(this));
  }

  /**
   * @description 渲染初始的聊天窗口界面。
   */
  render() {
    // 将输入框和按钮添加到输入区域
    this.inputArea.appendChild(this.inputField);
    this.inputArea.appendChild(this.sendButton);
    this.inputArea.appendChild(this.resetButton);

    // 将消息容器和输入区域添加到聊天窗口
    this.chatWindow.appendChild(this.messageContainer);
    this.chatWindow.appendChild(this.inputArea);

    // 将聊天窗口添加到主容器
    this.container.id = "smartfine-chat-container"; // Add unique ID
    this.container.appendChild(this.chatWindow);

    // 确保容器占据可用高度，并使用 flex 布局
    this.container.className += " h-screen flex flex-col p-4"; // 添加 Tailwind CSS 类
  }

  /**
   * @description 在聊天记录中添加一条用户消息。
   * @param {{role: string, content: string}} message - 消息对象。
   */
  addMessage(message) {
    const messageElement = document.createElement("div");
    const isUser = message.role === "user";

    messageElement.className = `flex ${isUser ? "justify-end" : "justify-start"}`;

    const bubble = document.createElement("div");
    bubble.className = `max-w-xl p-3 rounded-xl shadow-sm ${
      isUser
        ? "bg-gray-700 text-white rounded-br-none"
        : "bg-gray-200 text-gray-800 rounded-bl-none"
    }`;
    bubble.textContent = message.content;

    messageElement.appendChild(bubble);
    this.messageContainer.appendChild(messageElement);

    // 滚动到底部以显示最新消息
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  }

  /**
   * @description 创建一个用于显示进度的AI消息气泡
   * @returns {HTMLElement} 创建的消息元素
   */
  createProgressMessage() {
    const messageElement = document.createElement("div");
    messageElement.className = "flex justify-start";

    const bubble = document.createElement("div");
    bubble.className = "max-w-xl p-3 rounded-xl shadow-sm bg-gray-200 text-gray-800 rounded-bl-none";

    messageElement.appendChild(bubble);
    this.messageContainer.appendChild(messageElement);
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;

    return bubble; // 返回气泡本身，以便更新其内容
  }

  /**
   * @description 更新指定消息元素的内容
   * @param {HTMLElement} element - 要更新的DOM元素 (消息气泡)
   * @param {string} htmlContent - 新的HTML内容
   */
  updateMessage(element, htmlContent) {
    element.innerHTML = htmlContent;
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  }

  /**
   * @description 从DOM中移除一个消息元素
   * @param {HTMLElement} element - 要移除的DOM元素 (消息气泡)
   */
  removeMessage(element) {
    // The element to remove is the bubble, its parent is the flex container
    if (element && element.parentElement) {
      element.parentElement.remove();
    }
  }

  /**
   * @description 根据阶段状态生成进度阶梯的HTML
   * @param {Array<Object>} stages - 阶段对象数组
   * @returns {string} - 进度阶梯的HTML字符串
   * @private
   */
  _renderProgressSteps(stages) {
    const icon_inprogress = "<svg class=\"animate-spin h-5 w-5 text-blue-500\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\"><circle class=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" stroke-width=\"4\"></circle><path class=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"></path></svg>";
    const icon_completed = "<svg class=\"h-5 w-5 text-green-500\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z\" clip-rule=\"evenodd\" /></svg>";
    const icon_pending = "<svg class=\"h-5 w-5 text-gray-400\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" stroke-width=\"2\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" /></svg>";
    const icon_failed = "<svg class=\"h-5 w-5 text-red-500\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z\" clip-rule=\"evenodd\" /></svg>";

    return stages.map(stage => {
      let icon, textClass;
      switch (stage.status) {
        case "completed":
          icon = icon_completed;
          textClass = "text-gray-500 line-through";
          break;
        case "inprogress":
          icon = icon_inprogress;
          textClass = "text-blue-600 font-semibold";
          break;
        case "failed":
          icon = icon_failed;
          textClass = "text-red-600 font-semibold";
          break;
        case "pending":
        default:
          icon = icon_pending;
          textClass = "text-gray-500";
          break;
      }
      return `<div class="flex items-center space-x-3 py-1">
          ${icon}
          <span class="${textClass}">${stage.text}</span>
        </div>`;
    }).join("");
  }

  /**
   * @description 更新重置按钮的视觉提示。
   * @param {boolean} isStale - 数据是否已过时。
   */
  updateResetButton(isStale) {
    let dot = this.resetButton.querySelector(".stale-dot");
    if (isStale) {
      if (!dot) {
        dot = document.createElement("span");
        dot.className =
          "stale-dot absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white";
        this.resetButton.appendChild(dot);
        this.resetButton.title = "数据已更新，建议重置分析";
      }
    } else {
      if (dot) {
        dot.remove();
        this.resetButton.title = "";
      }
    }
  }

  /**
   * @description 清空输入框。
   */
  clearInput() {
    this.inputField.value = "";
    this.inputField.style.height = "auto"; // 重置高度
    this.inputField.rows = 1; // 重置行数
  }

  /**
   * @private
   * @description 处理用户提交消息。
   */
  _handleSubmit() {
    const message = this.inputField.value.trim();
    if (message && this.onSubmit) {
      this.onSubmit(message);
    }
  }

  /**
   * @private
   * @description 处理用户点击重置按钮。
   */
  _handleReset() {
    if (this.onReset) {
      this.onReset();
    }
  }

  /**
   * @private
   * @description 自动调整文本输入框的高度。
   */
  _autoResizeInput() {
    this.inputField.style.height = "auto"; // Reset height to recalculate
    this.inputField.style.height = this.inputField.scrollHeight + "px";
  }
}
