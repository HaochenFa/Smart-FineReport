<script>
  import {onMount} from 'svelte';
  import {Logger} from './utils/logger.js';
  import {SETTINGS} from './utils/settings.js';
  import AppController from './app/app-controller.js';
  import {resizable} from './utils/resizable.js';

  let showModal = false;
  let isAssistantInitialized = false;
  let appInstance = null;
  let fab;
  let modalOverlay;
  let modalContent;

  // FAB 拖拽逻辑
  let isDragging = false;
  let wasDragged = false;
  let offsetX, offsetY;

  function handleMouseDown(e) {
    isDragging = true;
    wasDragged = false;
    fab.style.cursor = "grabbing";
    offsetX = e.clientX - fab.getBoundingClientRect().left;
    offsetY = e.clientY - fab.getBoundingClientRect().top;
    e.preventDefault();
  }

  function handleMouseMove(e) {
    if (!isDragging) return;
    wasDragged = true;
    let newX = e.clientX - offsetX;
    let newY = e.clientY - offsetY;

    const fabRect = fab.getBoundingClientRect();
    newX = Math.max(0, Math.min(newX, window.innerWidth - fabRect.width));
    newY = Math.max(0, Math.min(newY, window.innerHeight - fabRect.height));

    fab.style.left = `${newX}px`;
    fab.style.top = `${newY}px`;
    fab.style.right = "auto";
    fab.style.bottom = "auto";
  }

  function handleMouseUp() {
    if (isDragging) {
      isDragging = false;
      fab.style.cursor = "grab";
    }
  }

  // Modal 拖拽 action
  function draggable(node) {
    let x;
    let y;

    function handleMousedown(e) {
      x = e.clientX;
      y = e.clientY;

      node.style.position = 'absolute'; // 确保可以定位
      node.style.cursor = 'grabbing';

      window.addEventListener('mousemove', handleMousemove);
      window.addEventListener('mouseup', handleMouseup);
    }

    function handleMousemove(e) {
      const dx = e.clientX - x;
      const dy = e.clientY - y;

      node.style.left = `${node.offsetLeft + dx}px`;
      node.style.top = `${node.offsetTop + dy}px`;

      x = e.clientX;
      y = e.clientY;
    }

    function handleMouseup() {
      node.style.cursor = 'grab';
      window.removeEventListener('mousemove', handleMousemove);
      window.removeEventListener('mouseup', handleMouseup);
    }

    node.addEventListener('mousedown', handleMousedown);

    return {
      destroy() {
        node.removeEventListener('mousedown', handleMousedown);
      }
    };
  }

  function handleFabClick() {
    if (!wasDragged) {
      showModal = true;
      if (!isAssistantInitialized) {
        try {
          Logger.log("Initializing AI Assistant for the first time...");
          const serviceUrl = SETTINGS.service.url;
          appInstance = new AppController(serviceUrl);
          // 注意：这里需要确保 #ai-container 已经渲染到 DOM 中
          appInstance.init('#ai-container');
          isAssistantInitialized = true;
          Logger.log("AI Assistant Initialized Successfully.");
        } catch (error) {
          Logger.error("A critical error occurred during initialization:", error);
          const container = modalOverlay.querySelector('#ai-container');
          if (container) {
            container.innerHTML = `
              <div style="padding: 20px; text-align: center; color: #757575; font-family: sans-serif;">
                <p style="margin: 0; font-weight: 500;">AI 分析助手初始化失败</p>
                <p style="margin: 8px 0 0; font-size: 14px;">请检查控制台日志或联系技术支持。</p>
              </div>
            `;
          }
        }
      }
    }
  }

  onMount(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  });

</script>

<button
        bind:this={fab}
        id="ai-assistant-fab"
        on:mousedown={handleMouseDown}
        on:click={handleFabClick}
>
    &#x1F916;
</button>

{#if showModal}
    <div class="ai-modal-overlay" bind:this={modalOverlay}
         on:click={(e) => { if (e.target === modalOverlay) showModal = false; }}
         on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { if (e.target === modalOverlay) showModal = false; } }}
         role="button" tabindex="0">
        <div class="ai-modal-content" bind:this={modalContent} use:draggable use:resizable>
            <button class="ai-modal-close-btn" on:click={() => { showModal = false; }}>&times;</button>
            <div id="ai-container"></div>
        </div>
    </div>
{/if}

<style global>
    /* FAB Styles */
    #ai-assistant-fab {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 60px;
        height: 60px;
        background-color: #1890ff;
        color: white;
        border: none;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        cursor: grab;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 28px; /* Icon size */
        z-index: 9999;
        transition: background-color 0.3s, transform 0.2s ease-out;
        user-select: none; /* Prevent text selection during drag */
    }

    #ai-assistant-fab:hover {
        background-color: #40a9ff;
        transform: scale(1.05);
    }

    #ai-assistant-fab:active {
        cursor: grabbing;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
        transform: scale(0.98);
    }

    /* Modal Styles */
    .ai-modal-overlay {
        display: flex; /* Always flex when shown */
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        justify-content: center;
        align-items: center;
        z-index: 10000;
    }

    .ai-modal-content {
        position: relative;
        background: white;
        width: 90vw;
        max-width: 800px;
        min-width: 550px;
        height: 85vh;
        max-height: 900px;
        min-height: 600px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .ai-modal-close-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        background: transparent;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #888;
        z-index: 10010;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 30px;
        height: 30px;
    }

    .ai-modal-close-btn:hover {
        color: #000;
    }

    #ai-container {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
    }

    .ai-modal-close-btn svg,
    #ai-assistant-fab svg {
        width: 100%;
        height: 100%;
    }

    /* Resizable handles styles */
    .resizer {
        position: absolute;
        background: rgba(0, 0, 0, 0.1); /* For debugging, make it transparent in production */
        z-index: 1000;
    }

    .resizer.top-left {
        top: -5px;
        left: -5px;
        cursor: nwse-resize;
    }

    .resizer.top-right {
        top: -5px;
        right: -5px;
        cursor: nesw-resize;
    }

    .resizer.bottom-left {
        bottom: -5px;
        left: -5px;
        cursor: nesw-resize;
    }

    .resizer.bottom-right {
        bottom: -5px;
        right: -5px;
        cursor: nwse-resize;
    }

    .resizer.top {
        top: -5px;
        left: 5px;
        right: 5px;
        height: 10px;
        cursor: ns-resize;
    }

    .resizer.bottom {
        bottom: -5px;
        left: 5px;
        right: 5px;
        height: 10px;
        cursor: ns-resize;
    }

    .resizer.left {
        left: -5px;
        top: 5px;
        bottom: 5px;
        width: 10px;
        cursor: ew-resize;
    }

    .resizer.right {
        right: -5px;
        top: 5px;
        bottom: 5px;
        width: 10px;
        cursor: ew-resize;
    }
</style>