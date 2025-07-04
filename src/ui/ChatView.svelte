<script>
  import {createEventDispatcher} from 'svelte';

  export let messages = []; // 新增 messages props
  export let isDisabled = false; // 新增 isDisabled props

  const dispatch = createEventDispatcher();


  let inputField;
  let assistantStatusElement;
  let resetButton;
  let messageContainer;

  let inputValue = '';

  function autoResizeInput() {
    if (inputField) {
      inputField.style.height = 'auto';
      inputField.style.height = inputField.scrollHeight + 'px';
    }
  }

  function handleSubmit() {
    const message = inputValue.trim();
    if (message) {
      dispatch('submitMessage', message);
      inputValue = ''; // 提交后清空输入框
      autoResizeInput(); // 重置输入框高度
    }
  }

  function handleReset() {
    dispatch('resetAnalysis');
  }

  // 消息渲染逻辑
  function renderMessage(message) {
    const {role, content, type} = message;

    let bubbleClass = "";
    let messageClass = "";

    if (role === "user") {
      messageClass = "flex justify-end mb-4 items-start";
      bubbleClass = "bg-blue-500 text-white rounded-lg p-3 max-w-lg shadow-md";
    } else if (role === "assistant") {
      messageClass = "flex justify-start mb-4 items-start";
      bubbleClass = "bg-white text-gray-800 rounded-lg p-3 max-w-[80%] shadow-md prose-ai-response";
    } else { // System message
      messageClass = "text-center my-2";
      let systemSpanClasses = "text-xs bg-gray-100 rounded-full px-3 py-1"; // Base classes

      if (type === "error") {
        systemSpanClasses += " text-red-500";
      } else if (type === "warning") {
        systemSpanClasses += " text-orange-500";
      } else { // Default system message
        systemSpanClasses += " text-gray-500";
      }
      return `<div class="${messageClass}"><span class="${systemSpanClasses}">${content}</span></div>`;
    }

    return `<div class="${messageClass}"><div class="${bubbleClass}">${content}</div></div>`;
  }

  export function showAssistantStatus(statusText) {
    if (assistantStatusElement) {
      assistantStatusElement.textContent = statusText;
      assistantStatusElement.style.display = 'block';
    }
  }

  export function hideAssistantStatus() {
    if (assistantStatusElement) {
      assistantStatusElement.style.display = 'none';
    }
  }

  export function updateResetButton(isStale) {
    let dot = resetButton?.querySelector('.stale-dot');
    if (isStale) {
      if (!dot) {
        dot = document.createElement('span');
        dot.className = 'stale-dot absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full';
        resetButton.appendChild(dot);
        resetButton.title = '数据已更新，建议重置分析';
      }
    } else {
      if (dot) {
        dot.remove();
        resetButton.title = '';
      }
    }
  }

</script>

<div class="flex flex-col h-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-200/50">
    <div bind:this={assistantStatusElement} class="text-center text-gray-500 text-sm my-2" style="display: none;"></div>
    <div bind:this={messageContainer} class="flex-1 flex flex-col overflow-y-auto p-4 space-y-4" id="message-container">
        {#each messages as message (message.id || JSON.stringify(message))}
            {@html renderMessage(message)}
        {/each}
    </div>

    <div class="p-4 border-t border-gray-200/80 bg-white/50">
        <div class="flex items-stretch w-full">
            <button
                    bind:this={resetButton}
                    class="p-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-300 relative flex items-center justify-center"
                    on:click={handleReset}
                    disabled={isDisabled}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 20v-5h-5"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 9a9 9 0 0114.13-6.36"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M20 15a9 9 0 01-14.13 6.36"/>
                </svg>
            </button>
            <textarea
                    bind:this={inputField}
                    bind:value={inputValue}
                    class="ml-5 mr-5 flex-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-12 overflow-hidden bg-gray-50/90 transition-all duration-300"
                    placeholder="输入你的分析请求... (Shift+Enter 换行)"
                    rows="1"
                    on:input={autoResizeInput}
                    on:keypress={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
                    disabled={isDisabled}
            ></textarea>
            <button
                    class="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    on:click={handleSubmit}
                    disabled={isDisabled}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                </svg>
            </button>
        </div>
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