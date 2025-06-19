/**
 * @file chat-view.js
 * @author Haochen (Billy) Fa
 * @description UI Layer, organize DOM elements 纯粹 UI 视图层，管理 DOM 元素
 */

export class ChatView {
  /**
   * @param {HTMLElement} container - UI将被渲染到的容器元素。
   * @param {function} onSubmit - 当用户提交输入时的回调函数。
   */
  constructor(container, onSubmit) {
    this.container = container;
    this.onSubmit = onSubmit; // 用户提交消息时的回调函数

    // 创建UI元素
    this.chatWindow = document.createElement('div'); // 聊天窗口主容器
    this.chatWindow.className = 'flex flex-col h-full bg-gray-50 rounded-lg shadow-md overflow-hidden';

    this.messageContainer = document.createElement('div'); // 消息显示区域
    this.messageContainer.className = 'flex-1 overflow-y-auto p-4 space-y-4';
    this.messageContainer.id = 'message-container';

    this.inputArea = document.createElement('div'); // 输入区域
    this.inputArea.className = 'flex items-center p-4 border-t border-gray-200 bg-white';

    this.inputField = document.createElement('textarea'); // 文本输入框
    this.inputField.className = 'flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-12 overflow-hidden';
    this.inputField.placeholder = '输入你的消息...';
    this.inputField.rows = 1;
    this.inputField.addEventListener('input', this._autoResizeInput.bind(this)); // 自动调整输入框高度
    this.inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { // 回车发送，Shift+回车换行
        e.preventDefault();
        this._handleSubmit();
      }
    });

    this.sendButton = document.createElement('button'); // 发送按钮
    this.sendButton.className = 'ml-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200';
    this.sendButton.textContent = '发送';
    this.sendButton.addEventListener('click', this._handleSubmit.bind(this));

    this.loadingIndicator = document.createElement('div'); // 加载指示器
    this.loadingIndicator.className = 'hidden absolute bottom-20 left-1/2 -translate-x-1/2 p-2 bg-blue-500 text-white rounded-full shadow-lg';
    this.loadingIndicator.innerHTML = '<svg class="animate-spin h-5 w-5 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>加载中...';
  }

  /**
   * @description 渲染初始的聊天窗口界面。
   */
  render() {
    // 将输入框和按钮添加到输入区域
    this.inputArea.appendChild(this.inputField);
    this.inputArea.appendChild(this.sendButton);

    // 将消息容器和输入区域添加到聊天窗口
    this.chatWindow.appendChild(this.messageContainer);
    this.chatWindow.appendChild(this.inputArea);

    // 将聊天窗口和加载指示器添加到主容器
    this.container.appendChild(this.chatWindow);
    this.container.appendChild(this.loadingIndicator);

    // 确保容器占据可用高度，并使用 flex 布局
    this.container.className += ' h-screen flex flex-col p-4 font-inter'; // 添加 Tailwind CSS 类
  }

  /**
   * @description 在聊天记录中添加一条新消息。
   * @param {{role: string, content: string}} message - 消息对象。
   */
  addMessage(message) {
    const messageElement = document.createElement('div');
    const isUser = message.role === 'user';

    messageElement.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');
    bubble.className = `max-w-xl p-3 rounded-xl shadow-sm ${
      isUser ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'
    }`;
    bubble.textContent = message.content;

    messageElement.appendChild(bubble);
    this.messageContainer.appendChild(messageElement);

    // 滚动到底部以显示最新消息
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  }

  /**
   * @description 控制加载指示器的显示与隐藏。
   * @param {boolean} show - 是否显示。
   */
  toggleLoading(show) {
    if (show) {
      this.loadingIndicator.classList.remove('hidden');
    } else {
      this.loadingIndicator.classList.add('hidden');
    }
    // 禁用/启用输入框和发送按钮，防止重复提交
    this.inputField.disabled = show;
    this.sendButton.disabled = show;
  }

  /**
   * @description 清空输入框。
   */
  clearInput() {
    this.inputField.value = '';
    this.inputField.style.height = 'auto'; // 重置高度
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
   * @description 自动调整文本输入框的高度。
   */
  _autoResizeInput() {
    this.inputField.style.height = 'auto'; // Reset height to recalculate
    this.inputField.style.height = this.inputField.scrollHeight + 'px';
  }
}