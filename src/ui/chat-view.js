/**
 * @file chat-view.js
 * @author Haochen (Billy) Fa
 * @description UI Layer, organize DOM elements 纯粹 UI 视图层，管理 DOM 元素
 */
import {marked} from "marked";
import mermaid from "mermaid";
import hljs from "highlight.js";

export class ChatView {
  /**
   * @param {HTMLElement} container - UI将被渲染到的容器元素。
   * @param {function} onSubmit - 当用户提交输入时的回调函数。
   * @param {function} onReset - 当用户点击重置按钮时的回调函数。
   */
  constructor(container, onSubmit, onReset) {
    this.container = container;
    this.onSubmit = onSubmit;
    this.onReset = onReset;

    this._setupMarkdown();

    this.chatWindow = document.createElement("div");
    this.chatWindow.className =
      "flex flex-col h-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-200/50";

    this.messageContainer = document.createElement("div");
    this.messageContainer.className = "flex-1 overflow-y-auto p-4 space-y-4";
    this.messageContainer.id = "message-container";

    this.inputArea = document.createElement("div");
    this.inputArea.className =
      "p-4 border-t border-gray-200/80 bg-white/50";

    const inputWrapper = document.createElement("div");
    inputWrapper.className = "flex items-center space-x-2";

    this.inputField = document.createElement("textarea");
    this.inputField.className =
      "flex-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-12 overflow-hidden bg-gray-50/90 transition-all duration-300";
    this.inputField.placeholder = "输入你的分析请求... (Shift+Enter 换行)";
    this.inputField.rows = 1;
    this.inputField.addEventListener("input", this._autoResizeInput.bind(this));
    this.inputField.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this._handleSubmit();
      }
    });

    this.sendButton = document.createElement("button");
    this.sendButton.className =
      "px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5";
    this.sendButton.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"h-6 w-6\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 10l7-7m0 0l7 7m-7-7v18\" /></svg>";
    this.sendButton.addEventListener("click", this._handleSubmit.bind(this));

    this.resetButton = document.createElement("button");
    this.resetButton.className =
      "p-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-300 relative";
    this.resetButton.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"h-6 w-6\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 4v5h5\" /><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M20 20v-5h-5\" /><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 9a9 9 0 0114.13-6.36\" /><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M20 15a9 9 0 01-14.13 6.36\" /></svg>";
    this.resetButton.addEventListener("click", this._handleReset.bind(this));

    inputWrapper.appendChild(this.resetButton);
    inputWrapper.appendChild(this.inputField);
    inputWrapper.appendChild(this.sendButton);
    this.inputArea.appendChild(inputWrapper);
  }

  _setupMarkdown() {
    marked.setOptions({
      highlight: (code, lang) => {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, {language}).value;
      },
      async: true,
    });
    mermaid.initialize({startOnLoad: false});
  }

  render() {
    this.chatWindow.appendChild(this.messageContainer);
    this.chatWindow.appendChild(this.inputArea);
    this.container.id = "smartfine-chat-container";
    this.container.appendChild(this.chatWindow);
    this.container.className += " h-full flex flex-col";
  }

  async addMessage(message) {
    const messageElement = document.createElement("div");
    const {role, content} = message;

    let bubbleStyle = "";
    if (role === "user") {
      messageElement.className = "flex justify-end mb-4 items-start";
      bubbleStyle = "bg-blue-500 text-white rounded-lg p-3 max-w-lg shadow-md";
    } else if (role === "assistant") {
      messageElement.className = "flex justify-start mb-4 items-start";
      bubbleStyle = "bg-white text-gray-800 rounded-lg p-3 max-w-lg shadow-md prose-ai-response";
    } else {
      messageElement.className = "text-center my-2";
      const systemSpan = document.createElement("span");
      systemSpan.className =
        "text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1";
      systemSpan.textContent = content;
      messageElement.appendChild(systemSpan);
      this.messageContainer.appendChild(messageElement);
      this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
      return;
    }

    const bubble = document.createElement("div");
    bubble.className = bubbleStyle;

    if (role === "assistant") {
      await this._renderMarkdown(bubble, content);
    } else {
      bubble.textContent = content;
    }

    messageElement.appendChild(bubble);
    this.messageContainer.appendChild(messageElement);
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  }

  async _renderMarkdown(element, content) {
    try {
      const html = await marked.parse(content);
      element.innerHTML = html;
      const mermaidElements = element.querySelectorAll(".language-mermaid");
      for (const el of mermaidElements) {
        const code = el.textContent;
        const {svg} = await mermaid.render(
          `mermaid-${Date.now()}`,
          code
        );
        const svgContainer = document.createElement("div");
        svgContainer.innerHTML = svg;
        el.parentNode.replaceWith(svgContainer);
      }
    } catch (e) {
      element.innerHTML = content; // Fallback to raw content on error
      console.error("Markdown rendering error:", e);
    }
  }

  createProgressMessage() {
    const messageElement = document.createElement("div");
    messageElement.className = "flex justify-start mb-4 items-start";

    const bubble = document.createElement("div");
    bubble.className = "bg-white text-gray-800 rounded-lg p-3 max-w-lg shadow-md";
    bubble.innerHTML = "<div class=\"flex items-center\"><svg class=\"animate-spin h-5 w-5 mr-3 text-blue-500\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\"><circle class=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" stroke-width=\"4\"></circle><path class=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"></path></svg><span>分析中...</span></div>";

    messageElement.appendChild(bubble);
    this.messageContainer.appendChild(messageElement);
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;

    return bubble;
  }

  async updateMessage(element, htmlContent) {
    await this._renderMarkdown(element, htmlContent);
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
    const icons = {
      inprogress: "<svg class=\"animate-spin h-5 w-5 text-blue-500\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\"><circle class=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" stroke-width=\"4\"></circle><path class=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"></path></svg>",
      completed: "<svg class=\"h-5 w-5 text-green-500\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z\" clip-rule=\"evenodd\" /></svg>",
      pending: "<svg class=\"h-5 w-5 text-gray-400\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" stroke-width=\"2\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" /></svg>",
      failed: "<svg class=\"h-5 w-5 text-red-500\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z\" clip-rule=\"evenodd\" /></svg>"
    };

    return stages.map(stage => {
      const icon = icons[stage.status] || icons.pending;
      const textClass = stage.status === "completed" ? "text-gray-500 line-through" : "text-gray-800";
      return `<div class="flex items-center space-x-2 py-1">
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
        dot.className = "stale-dot absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full";
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
