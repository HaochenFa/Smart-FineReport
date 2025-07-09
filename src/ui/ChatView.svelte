<script>
  import { createEventDispatcher } from "svelte";

  export let messages = []; // 新增 messages props
  export let isDisabled = false; // 新增 isDisabled props

  const dispatch = createEventDispatcher();

  let inputField;
  let assistantStatusElement;
  let resetButton;
  let messageContainer;

  let inputValue = "";

  function autoResizeInput() {
    if (inputField) {
      const minHeight = 28; // 最小高度
      const maxHeight = 114; // 最大高度

      // 如果内容为空，设置为最小高度
      if (!inputValue.trim()) {
        inputField.style.height = minHeight + "px";
        return;
      }

      // 临时设置为auto来获取真实高度
      inputField.style.height = "auto";
      const scrollHeight = inputField.scrollHeight;

      // 设置高度，确保在最小和最大高度之间
      const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
      inputField.style.height = newHeight + "px";
    }
  }

  function handleSubmit() {
    const message = inputValue.trim();
    if (message) {
      dispatch("submitMessage", message);
      inputValue = ""; // 提交后清空输入框
      // 使用 setTimeout 确保 inputValue 更新后再调整高度
      setTimeout(() => {
        autoResizeInput(); // 重置输入框高度
      }, 0);
    }
  }

  function handleReset() {
    dispatch("resetAnalysis");
  }

  // 消息渲染逻辑
  function renderMessage(message) {
    const { role, content, type } = message;

    let bubbleClass = "";
    let messageClass = "";

    if (role === "user") {
      messageClass = "flex justify-end mb-4 items-start";
      bubbleClass = "message-bubble-user";
    } else if (role === "assistant") {
      messageClass = "flex justify-start mb-4 items-start";
      bubbleClass = "message-bubble-assistant prose-ai-response";
    } else {
      // System message
      messageClass = "flex justify-center my-5";
      let systemSpanClasses = "message-bubble-system"; // Base classes

      if (type === "error") {
        systemSpanClasses += " error";
      } else if (type === "warning") {
        systemSpanClasses += " warning";
      } else if (
        type === "loading" ||
        content.includes("发送数据中") ||
        content.includes("处理中") ||
        content.includes("分析中")
      ) {
        systemSpanClasses += " loading";
      }

      // 保持系统消息简洁，不进行换行处理
      const processedContent = content;

      return `<div class="${messageClass}"><span class="${systemSpanClasses}">${processedContent}</span></div>`;
    }

    return `<div class="${messageClass}"><div class="${bubbleClass}">${content}</div></div>`;
  }

  export function showAssistantStatus(statusText) {
    if (assistantStatusElement) {
      assistantStatusElement.textContent = statusText;
      assistantStatusElement.style.display = "block";

      // 使用 requestAnimationFrame 确保 DOM 更新后再添加动画类
      requestAnimationFrame(() => {
        assistantStatusElement.classList.remove("hide");
        assistantStatusElement.classList.add("show");
      });
    }
  }

  export function hideAssistantStatus() {
    if (assistantStatusElement) {
      assistantStatusElement.classList.remove("show");
      assistantStatusElement.classList.add("hide");

      // 等待动画完成后隐藏元素
      setTimeout(() => {
        if (assistantStatusElement) {
          assistantStatusElement.style.display = "none";
          assistantStatusElement.classList.remove("hide");
        }
      }, 400); // 与CSS动画时间一致
    }
  }

  export function updateResetButton(isStale) {
    let dot = resetButton?.querySelector(".stale-dot");
    if (isStale) {
      if (!dot) {
        dot = document.createElement("span");
        dot.className = "stale-dot absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full";
        resetButton.appendChild(dot);
        resetButton.title = "数据已更新，建议重置分析";
      }
    } else {
      if (dot) {
        dot.remove();
        resetButton.title = "";
      }
    }
  }

  // Svelte action 用于设置初始高度
  function setInitialHeight(node) {
    node.style.height = "28px";
    return {
      destroy() {},
    };
  }
</script>

<div
  class="flex flex-col h-full overflow-hidden bg-gradient-to-b from-blue-50/20 to-indigo-50/15 rounded-[16px]"
>
  <div
    bind:this={assistantStatusElement}
    class="status-bar text-center text-gray-700 text-sm font-medium"
    style="display: none; z-index: 1000; position: relative;"
  ></div>
  <div
    bind:this={messageContainer}
    class="flex-1 flex flex-col overflow-y-auto px-8 py-6 space-y-4 scrollbar-thin scrollbar-thumb-blue-300/40 scrollbar-track-transparent"
    id="message-container"
  >
    {#each messages as message (message.id || JSON.stringify(message))}
      {@html renderMessage(message)}
    {/each}
  </div>

  <div
    class="px-20 py-8 mt-4 bg-gradient-to-r from-white/40 to-blue-50/30 backdrop-blur-sm rounded-b-[16px]"
    style="overflow: visible;"
  >
    <div class="flex items-center gap-4 w-full" style="overflow: visible;">
      <button
        bind:this={resetButton}
        class="chat-button-reset"
        on:click={handleReset}
        disabled={isDisabled}
        title="重置对话"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 20v-5h-5" />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 9a9 9 0 0114.13-6.36"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 15a9 9 0 01-14.13 6.36"
          />
        </svg>
      </button>
      <textarea
        bind:this={inputField}
        bind:value={inputValue}
        class="chat-input"
        placeholder="输入你的分析请求... (Shift+Enter 换行)"
        on:input={autoResizeInput}
        on:keypress={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        use:setInitialHeight
        disabled={isDisabled}
      ></textarea>
      <button
        class="chat-button-submit"
        on:click={handleSubmit}
        disabled={isDisabled}
        title="发送消息"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </div>
    <!-- 免责声明 -->
    <div class="disclaimer-text">AI分析可能会犯错，请您核查重要信息</div>
  </div>
</div>

<style global>
  /* Global styles for prose-ai-response, etc. if needed outside shadow DOM */
  .prose-ai-response {
    color: #374151;
  }

  .prose-ai-response h1,
  .prose-ai-response h2,
  .prose-ai-response h3,
  .prose-ai-response h4,
  .prose-ai-response h5,
  .prose-ai-response h6 {
    color: #1f2937;
    font-weight: 600;
    margin-top: 1.25em;
    margin-bottom: 0.5em;
  }

  .prose-ai-response h1 {
    font-size: 1.5em;
  }

  .prose-ai-response h2 {
    font-size: 1.25em;
  }

  .prose-ai-response h3 {
    font-size: 1.1em;
  }

  .prose-ai-response p {
    margin-bottom: 1em;
    line-height: 1.6;
  }

  .prose-ai-response ul,
  .prose-ai-response ol {
    margin-left: 1.5em;
    margin-bottom: 1em;
    padding-left: 0.5em;
  }

  .prose-ai-response li {
    margin-bottom: 0.5em;
  }

  .prose-ai-response blockquote {
    border-left: 4px solid #d1d5db;
    padding-left: 1em;
    margin-left: 0;
    font-style: italic;
    color: #4b5563;
  }

  .prose-ai-response pre {
    background-color: #1f2937;
    color: #f3f4f6;
    padding: 1em;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin-bottom: 1em;
  }

  .prose-ai-response code {
    font-family: "Courier New", Courier, monospace;
    background-color: #e5e7eb;
    padding: 0.2em 0.4em;
    border-radius: 0.25rem;
    font-size: 0.9em;
  }

  .prose-ai-response pre code {
    background-color: transparent;
    padding: 0;
    border-radius: 0;
  }

  .prose-ai-response table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1em;
  }

  .prose-ai-response th,
  .prose-ai-response td {
    border: 1px solid #d1d5db;
    padding: 0.75em 1em;
    text-align: left;
  }

  .prose-ai-response thead {
    background-color: #f3f4f6;
  }

  .prose-ai-response th {
    font-weight: 600;
  }

  .prose-ai-response a {
    color: #2563eb;
    text-decoration: none;
  }

  .prose-ai-response a:hover {
    text-decoration: underline;
  }
</style>
