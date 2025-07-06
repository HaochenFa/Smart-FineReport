<script>
  import {onMount, tick} from 'svelte';
  import {Logger} from './utils/logger.js';
  import {SETTINGS} from './utils/settings.js';
  import AppController from './app/app-controller.js';


  // Import logo images for inline packaging
  import logo40w from '../public/assets/logo-40w.png';
  import logo80w from '../public/assets/logo-80w.png';
  import logo120w from '../public/assets/logo-120w.png';

  let showModal = false;
  let isAssistantInitialized = false;
  let appInstance = null;
  let fab;
  let modalContent;
  let aiContainerElement;


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

    // 添加事件监听器
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
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

      // 移除事件监听器
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
  }

  // Modal 拖拽 action
  function draggable(node) {
    let x;
    let y;
    let isDraggingModal = false;

    function handleMousedown(e) {
      if (e.target.closest('button, textarea, input')) {
        return;
      }

      isDraggingModal = true;
      x = e.clientX;
      y = e.clientY;

      node.style.cursor = 'grabbing';

      window.addEventListener('mousemove', handleMousemove);
      window.addEventListener('mouseup', handleMouseup);
    }

    function handleMousemove(e) {
      if (!isDraggingModal) return;
      
      const dx = e.clientX - x;
      const dy = e.clientY - y;

      const currentLeft = parseInt(node.style.left) || 0;
      const currentTop = parseInt(node.style.top) || 0;

      node.style.left = `${currentLeft + dx}px`;
      node.style.top = `${currentTop + dy}px`;

      x = e.clientX;
      y = e.clientY;
    }

    function handleMouseup() {
      isDraggingModal = false;
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

  async function handleFabClick() {
    if (wasDragged) return;

    showModal = true;
    if (!isAssistantInitialized) {
      await tick();
      try {
        Logger.log("Initializing AI Assistant for the first time...");
        const serviceUrl = SETTINGS.service.url;
        appInstance = new AppController(serviceUrl);
        appInstance.init(aiContainerElement);
        isAssistantInitialized = true;
        Logger.log("AI Assistant Initialized Successfully.");
      } catch (error) {
        Logger.error("A critical error occurred during initialization:", error);
        if (aiContainerElement) {
          aiContainerElement.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #757575; font-family: sans-serif;">
              <p style="margin: 0; font-weight: 500;">AI 分析助手初始化失败</p>
              <p style="margin: 8px 0 0; font-size: 14px;">请检查控制台日志或联系技术支持。</p>
            </div>
          `;
        }
      }
    }
  }

  // Click outside to close logic
  function handleClickOutside(event) {
    if (fab && fab.contains(event.target)) {
      return;
    }

    if (modalContent && !modalContent.contains(event.target)) {
      showModal = false;
    }
  }


  // 初始化模态框位置
  function initializeModalPosition() {
    if (modalContent && typeof window !== 'undefined') {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const modalWidth = modalContent.offsetWidth || 800;
      const modalHeight = modalContent.offsetHeight || 600;

      const left = Math.max(0, (windowWidth - modalWidth) / 2);
      const top = Math.max(0, (windowHeight - modalHeight) / 2);

      modalContent.style.left = `${left}px`;
      modalContent.style.top = `${top}px`;
    }
  }

  $: {
    if (typeof window !== 'undefined') {
      if (showModal) {
        window.addEventListener('click', handleClickOutside, true);
        // 延迟初始化位置，确保DOM已渲染
        setTimeout(initializeModalPosition, 0);
      } else {
        window.removeEventListener('click', handleClickOutside, true);
      }
    }
  }

  onMount(() => {
    // 修复：只在需要时添加事件监听器，避免全局污染
    return () => {
      window.removeEventListener('click', handleClickOutside, true);
    };
  });

</script>

<button
        bind:this={fab}
        id="ai-assistant-fab"
        on:mousedown={handleMouseDown}
        on:click={handleFabClick}
>
    <img
            src={logo40w}
            srcset="{logo40w} 40w, {logo80w} 80w, {logo120w} 120w"
            sizes="40px"
            alt="AI Assistant Logo"/>
</button>

{#if showModal}
    <div class="ai-modal-content" bind:this={modalContent} use:draggable>
        <button class="ai-modal-close-btn" on:click={() => { showModal = false; }}>&times;</button>
        <div id="ai-container" bind:this={aiContainerElement}></div>
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
        border: none;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        cursor: grab;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        transition: background-color 0.3s, transform 0.2s ease-out;
        user-select: none; /* Prevent text selection during drag */
    }

    #ai-assistant-fab img {
        width: 40px;
        height: 40px;
        mix-blend-mode: multiply;
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
    .ai-modal-content {
        position: fixed;

        /* Liquid Glass Frame */
        background: rgba(255, 255, 255, 0.1);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
        backdrop-filter: blur(16px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.25), inset 0 2px 4px 0 rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        padding: 12px;

        width: 90vw;
        max-width: 800px;
        min-width: 550px;
        height: 85vh;
        max-height: 900px;
        min-height: 600px;
        display: flex;
        z-index: 10000;
    }

    .ai-modal-close-btn {
        position: absolute;
        top: 18px; /* Adjusted for padding */
        right: 18px; /* Adjusted for padding */
        background: rgba(0, 0, 0, 0.1);
        border: none;
        font-size: 18px;
        font-weight: bold;
        line-height: 28px;
        cursor: pointer;
        color: #555;
        z-index: 10010;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        transition: background-color 0.2s, color 0.2s;
    }

    .ai-modal-close-btn:hover {
        background-color: rgba(0, 0, 0, 0.2);
        color: #000;
    }

    #ai-container {
        width: 100%;
        height: 100%;
        /* Frosted Glass Canvas */
        background: rgba(255, 255, 255, 0.65);
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden; /* Important to contain children */
    }

    .ai-modal-close-btn svg,
    #ai-assistant-fab svg {
        width: 100%;
        height: 100%;
    }


</style>
