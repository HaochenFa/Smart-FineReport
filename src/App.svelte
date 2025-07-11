<script>
  import { onMount, tick } from "svelte";
  import { fade } from "svelte/transition";
  import { Logger } from "./utils/logger.js";
  import { SETTINGS } from "./utils/settings.js";
  import AppController from "./app/app-controller.js";
  import { UIManager } from "./ui/ui-manager.js";

  // Import logo images for inline packaging
  import logo40w from "../public/assets/logo-40w.png";
  import logo80w from "../public/assets/logo-80w.png";
  import logo120w from "../public/assets/logo-120w.png";
  import logoFullRes from "../public/assets/logo.png";

  let showModal = false;
  let isAssistantInitialized = false;
  let appInstance = null;
  let fab;
  let modalContent;
  let aiContainerElement;
  let isButtonClicked = false;
  let rippleActive = false;
  let fabPosition = { x: 0, y: 0 }; // FAB按钮中心坐标
  let modalOrigin = "50% 50%"; // Modal的transform-origin

  // 事件监听器引用管理
  let resizeHandler = null;
  let clickHandler = null;

  // FAB 拖拽逻辑
  let isDragging = false;
  let wasDragged = false;
  let offsetX, offsetY;
  let startX, startY; // 记录鼠标按下时的初始位置
  let startTime; // 记录鼠标按下的时间

  // 拖拽判断阈值
  const DRAG_THRESHOLD = 5; // 像素，超过此距离才认为是拖拽

  function handleMouseDown(e) {
    isDragging = true;
    wasDragged = false;

    // 记录初始位置和时间
    startX = e.clientX;
    startY = e.clientY;
    startTime = Date.now();

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

    // 计算移动距离
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 只有移动距离超过阈值才认为是拖拽
    if (distance > DRAG_THRESHOLD) {
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
      // 排除按钮、输入框和消息气泡区域
      if (
        e.target.closest(
          "button, textarea, input, .message-bubble-user, .message-bubble-assistant, .message-bubble-system, #message-container"
        )
      ) {
        return;
      }

      isDraggingModal = true;
      x = e.clientX;
      y = e.clientY;

      node.style.cursor = "grabbing";

      window.addEventListener("mousemove", handleMousemove);
      window.addEventListener("mouseup", handleMouseup);
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
      node.style.cursor = "grab";
      window.removeEventListener("mousemove", handleMousemove);
      window.removeEventListener("mouseup", handleMouseup);
    }

    node.addEventListener("mousedown", handleMousedown);

    return {
      destroy() {
        node.removeEventListener("mousedown", handleMousedown);
      },
    };
  }

  function calculateFabCenter() {
    if (!fab) return { x: 0, y: 0 };
    const rect = fab.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  function updateModalOrigin() {
    const { x, y } = fabPosition;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const originX = (x / vw) * 100;
    const originY = (y / vh) * 100;
    modalOrigin = `${originX}% ${originY}%`;
  }

  async function handleFabClick() {
    if (wasDragged) {
      return;
    }

    // 按钮点击动画效果
    isButtonClicked = true;
    rippleActive = true;

    // 300ms后重置按钮状态
    setTimeout(() => {
      isButtonClicked = false;
      rippleActive = false;
    }, 300);

    // 计算FAB按钮位置
    fabPosition = calculateFabCenter();
    updateModalOrigin();

    // UI第一优先级：立即显示弹窗
    showModal = true;

    // 后台异步初始化并自动开始分析（不阻塞UI）
    // 防止重复初始化：检查是否已初始化，以及是否正在加载中
    if (
      !isAssistantInitialized &&
      (!appInstance || !appInstance.stateManager || !appInstance.stateManager.getState().isLoading)
    ) {
      await initializeAndStartAnalysis(); // 添加await确保初始化完成后才继续执行
    } else {
      // 等待DOM更新完成
      await tick();

      // 验证appInstance状态，如果无效则重新初始化
      if (!appInstance || !appInstance.stateManager || !appInstance.uiManager) {
        Logger.warn("AppInstance is in invalid state, reinitializing...");

        // 清理可能存在的残留组件
        if (appInstance && appInstance.uiManager) {
          try {
            appInstance.uiManager.destroy();
          } catch (error) {
            Logger.error("Error destroying invalid UI manager:", error);
          }
        }

        isAssistantInitialized = false;
        appInstance = null;
        initializeAndStartAnalysis();
        return;
      }

      if (aiContainerElement) {
        try {
          // 销毁旧的UI管理器
          if (appInstance.uiManager) {
            appInstance.uiManager.destroy();
          }

          // 清空容器内容
          aiContainerElement.innerHTML = "";

          // 重新初始化UI管理器到新的容器
          appInstance.uiManager = new UIManager(
            aiContainerElement,
            appInstance.stateManager,
            appInstance.handleUserQuery.bind(appInstance),
            appInstance.resetAnalysis.bind(appInstance)
          );

          // 获取当前状态并更新UI
          const currentState = appInstance.stateManager.getState();

          // 确保UI显示当前状态
          appInstance.uiManager._update(currentState);
        } catch (error) {
          Logger.error("Error reinitializing UI:", error);
          // 如果重新初始化UI失败，回退到完全重新初始化
          if (appInstance && appInstance.uiManager) {
            try {
              appInstance.uiManager.destroy();
            } catch (destroyError) {
              Logger.error("Error destroying failed UI manager:", destroyError);
            }
          }
          isAssistantInitialized = false;
          appInstance = null;
          initializeAndStartAnalysis();
        }
      }
    }
  }

  async function initializeAndStartAnalysis() {
    // 等待DOM更新完成
    await tick();

    try {
      Logger.log("Initializing AI Assistant for the first time...");
      const serviceUrl = SETTINGS.service.url;
      appInstance = new AppController(serviceUrl);
      appInstance.init(aiContainerElement);

      // 确保在初始化过程中UI保持禁用状态
      if (appInstance && appInstance.stateManager) {
        appInstance.stateManager.setState({ isLoading: true });
      }

      Logger.log("AI Assistant base components initialized.");

      // 初始化完成后立即开始自动分析
      await appInstance.triggerInitialAnalysis();

      // 只有在完整初始化（包括首次分析）成功后才设置为已初始化
      isAssistantInitialized = true;

      // 只有在成功时才清除加载状态
      if (appInstance && appInstance.stateManager) {
        appInstance.stateManager.setState({ isLoading: false });
      }

      Logger.log("AI Assistant fully initialized and ready.");
    } catch (error) {
      Logger.error("A critical error occurred during initialization:", error);

      // 完全清理已创建的组件，防止状态不一致
      if (appInstance && appInstance.uiManager) {
        try {
          appInstance.uiManager.destroy();
        } catch (destroyError) {
          Logger.error("Error destroying UI manager:", destroyError);
        }
      }

      // 重置所有相关状态
      isAssistantInitialized = false;
      appInstance = null;

      // 关键修复：不要清除加载状态，保持UI禁用
      // 这样用户就无法在错误状态下输入内容

      // 清空容器并显示友好的错误信息，包含重试选项
      if (aiContainerElement) {
        aiContainerElement.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #757575; font-family: sans-serif;">
            <p style="margin: 0; font-weight: 500;">AI 分析助手初始化失败</p>
            <p style="margin: 8px 0 0; font-size: 14px;">请检查网络连接或稍后重试。</p>
            <div style="margin-top: 16px;">
              <button onclick="window.location.reload()" style="margin-right: 8px; padding: 8px 16px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                重新加载页面
              </button>
              <button onclick="document.querySelector('#ai-assistant-fab').click()" style="padding: 8px 16px; background: #52c41a; color: white; border: none; border-radius: 4px; cursor: pointer;">
                重试初始化
              </button>
            </div>
          </div>
        `;
      }
    }
  }

  function dynamicScale(node, { duration = 180, start = 0.8, origin = "50% 50%" }) {
    return {
      duration,
      css: (t) => {
        const scale = start + (1 - start) * t;
        const opacity = t;
        return `
          transform: scale(${scale});
          transform-origin: ${origin};
          opacity: ${opacity};
        `;
      },
    };
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

  // 初始化模态框位置 - 相对于页面内容居中
  function initializeModalPosition() {
    if (modalContent && typeof window !== "undefined") {
      // 获取页面滚动位置
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      // 获取视口尺寸
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 获取弹窗尺寸
      const modalWidth = modalContent.offsetWidth;
      const modalHeight = modalContent.offsetHeight;

      // 计算相对于当前视口的居中位置
      const left = scrollLeft + (viewportWidth - modalWidth) / 2;
      const top = scrollTop + (viewportHeight - modalHeight) / 2;

      // 设置位置
      modalContent.style.position = "absolute";
      modalContent.style.left = `${Math.max(0, left)}px`;
      modalContent.style.top = `${Math.max(0, top)}px`;
      modalContent.style.transform = "none"; // 移除CSS transform
    }
  }

  $: {
    if (typeof window !== "undefined") {
      // 清理旧的点击监听器
      if (clickHandler) {
        window.removeEventListener("click", clickHandler, true);
        clickHandler = null;
      }

      if (showModal) {
        clickHandler = handleClickOutside;
        window.addEventListener("click", clickHandler, true);
        // 延迟初始化位置，确保DOM已渲染
        setTimeout(initializeModalPosition, 0);
      }
    }
  }

  // 窗口大小变化时重新计算
  $: if (typeof window !== "undefined") {
    // 清理旧的resize监听器
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }

    if (showModal && fab) {
      // 创建新的处理函数
      resizeHandler = () => {
        fabPosition = calculateFabCenter();
        updateModalOrigin();
      };
      window.addEventListener("resize", resizeHandler);
    }
  }

  onMount(() => {
    // 组件卸载时清理所有事件监听器
    return () => {
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
      }
      if (clickHandler) {
        window.removeEventListener("click", clickHandler, true);
      }
    };
  });
</script>

<button
  bind:this={fab}
  id="ai-assistant-fab"
  class:fab-clicked={isButtonClicked}
  class:fab-ripple={rippleActive}
  on:mousedown={handleMouseDown}
  on:click={handleFabClick}
>
  <img
    src={logo40w}
    srcset="{logo40w} 40w, {logo80w} 80w, {logo120w} 120w"
    sizes="40px"
    alt="AI Assistant Logo"
  />
</button>

{#if showModal}
  <div
    class="ai-modal-content"
    bind:this={modalContent}
    use:draggable
    transition:dynamicScale={{ duration: 180, start: 0.8, origin: modalOrigin }}
  >
    <button
      class="ai-modal-close-btn"
      on:click={() => {
        showModal = false;
      }}>&times;</button
    >
    <div id="ai-container" bind:this={aiContainerElement}>
      {#if !isAssistantInitialized}
        <div class="welcome-loading" transition:fade={{ duration: 300 }}>
          <div class="welcome-content">
            <img src={logoFullRes} alt="AI Assistant" class="welcome-logo" />
            <h3 class="welcome-title">AI 分析助手</h3>
            <p class="welcome-subtitle">正在为您分析当前报表...</p>
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      {/if}
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
    border: none;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    cursor: grab;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    transition:
      background-color 0.3s,
      transform 0.2s ease-out;
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

  /* FAB 动画状态 */
  #ai-assistant-fab.fab-clicked {
    transform: scale(0.95);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    transition: all 0.15s ease-out;
  }

  #ai-assistant-fab.fab-ripple::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    animation: ripple 0.6s ease-out;
  }

  @keyframes ripple {
    to {
      width: 120px;
      height: 120px;
      opacity: 0;
    }
  }

  /* Modal Styles - Apple 2025 WWDC Liquid Glass Design */
  .ai-modal-content {
    /* 位置由JavaScript动态设置 */
    position: absolute;

    /* Apple 2025 WWDC Liquid Glass Frame - 真实玻璃扭曲效果 */
    background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
      radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
      linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.05) 0%,
        rgba(255, 255, 255, 0.02) 30%,
        rgba(255, 255, 255, 0.08) 70%,
        rgba(255, 255, 255, 0.03) 100%
      );

    /* 增强的玻璃效果 - 模拟曲率和扭曲 */
    -webkit-backdrop-filter: blur(24px) saturate(180%) brightness(1.15) contrast(1.1);
    backdrop-filter: blur(24px) saturate(180%) brightness(1.15) contrast(1.1);

    /* 玻璃边缘效果 - 使用兼容圆角的边框 */
    border: 1px solid rgba(255, 255, 255, 0.25);

    /* 多层阴影模拟玻璃深度和光线折射 */
    box-shadow:
      0 8px 32px 0 rgba(31, 38, 135, 0.12),
      0 2px 16px 0 rgba(31, 38, 135, 0.08),
      0 1px 4px 0 rgba(255, 255, 255, 0.1),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.4),
      inset 0 -1px 0 0 rgba(255, 255, 255, 0.15),
      inset 1px 0 0 0 rgba(255, 255, 255, 0.2),
      inset -1px 0 0 0 rgba(255, 255, 255, 0.1);

    border-radius: 20px;
    padding: 8px;

    width: 90vw;
    max-width: 800px;
    min-width: 550px;
    height: 85vh;
    max-height: 900px;
    min-height: 600px;
    display: flex;
    z-index: 10000;

    /* 玻璃曲率效果 */
    transform: perspective(1000px) rotateX(0.5deg) rotateY(0.2deg);
    transform-style: preserve-3d;
  }

  .ai-modal-close-btn {
    position: absolute;
    top: 10px; /* Aligned with container padding */
    right: 10px; /* Aligned with container padding */

    /* 毛玻璃背景效果 */
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.25) 0%,
      rgba(255, 255, 255, 0.15) 100%
    );

    /* 高斯模糊效果 */
    backdrop-filter: blur(16px) saturate(180%) brightness(1.1);
    -webkit-backdrop-filter: blur(16px) saturate(180%) brightness(1.1);

    /* 边框效果 */
    border: 1px solid rgba(255, 255, 255, 0.3);

    /* 多层阴影效果 - 营造上层感 */
    box-shadow:
      0 8px 16px rgba(0, 0, 0, 0.15),
      0 4px 8px rgba(0, 0, 0, 0.1),
      0 2px 4px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 -1px 0 rgba(255, 255, 255, 0.2);

    font-size: 18px;
    font-weight: bold;
    line-height: 28px;
    cursor: pointer;
    color: #333;
    z-index: 10010;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;

    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .ai-modal-close-btn:hover {
    /* 悬停时增强效果 */
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.35) 0%,
      rgba(255, 255, 255, 0.25) 100%
    );

    box-shadow:
      0 12px 24px rgba(0, 0, 0, 0.2),
      0 6px 12px rgba(0, 0, 0, 0.15),
      0 3px 6px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      inset 0 -1px 0 rgba(255, 255, 255, 0.3);

    color: #000;
    transform: scale(1.05);
  }

  .ai-modal-close-btn:active {
    transform: scale(0.95);
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.2),
      0 2px 4px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  /* #ai-container 样式已移至 main.css 中统一管理 */

  .ai-modal-close-btn svg,
  #ai-assistant-fab svg {
    width: 100%;
    height: 100%;
  }

  /* 欢迎加载界面样式 */
  .welcome-loading {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10001;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  }

  .welcome-content {
    text-align: center;
    padding: 40px 20px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    max-width: 300px;
  }

  .welcome-logo {
    width: 80px;
    height: 80px;
    margin-bottom: 20px;
    opacity: 0.9;
    animation: breathing 2s ease-in-out infinite;
  }

  .welcome-title {
    color: #1890ff;
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 12px 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .welcome-subtitle {
    color: #666;
    font-size: 16px;
    margin: 0 0 24px 0;
    line-height: 1.5;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .loading-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
  }

  .loading-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #1890ff;
    animation: loading-bounce 1.4s ease-in-out infinite both;
  }

  .loading-dots span:nth-child(1) {
    animation-delay: -0.32s;
  }

  .loading-dots span:nth-child(2) {
    animation-delay: -0.16s;
  }

  .loading-dots span:nth-child(3) {
    animation-delay: 0s;
  }

  @keyframes breathing {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.1);
      opacity: 1;
    }
  }

  @keyframes loading-bounce {
    0%,
    80%,
    100% {
      transform: scale(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* 性能优化 */
  #ai-assistant-fab,
  .ai-modal-content,
  .loading-splash {
    will-change: transform;
  }

  /* 减少动画偏好支持 */
  @media (prefers-reduced-motion: reduce) {
    #ai-assistant-fab,
    .ai-modal-content,
    .welcome-logo,
    .loading-dots span {
      animation: none !important;
      transition: none !important;
    }
  }
</style>
