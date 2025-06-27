/**
 * @file main.js
 * @author Haochen (Billy) Fa
 * @description 主入口文件，实现AI助手的自举、UI动态注入和初始化。
 */

import "./styles/main.css";
import "./styles/fab.css"; // 引入新的样式文件
import AppController from "@/app/app-controller.js";
import {SETTINGS} from "@/utils/settings.js";
import {Logger} from "@/utils/logger.js";

// 存储 AppController 实例和初始化状态
let appInstance = null;
let isAssistantInitialized = false;

/**
 * @function bootstrapAIAssistant
 * @description 核心自举函数。动态创建并注入UI元素（浮动按钮、模态框），并设置事件监听器。
 * @param {object} options - (可选) 初始化配置
 * @param {string} options.bffUrl - (可选) 后端 BFF 服务的 URL
 */
const bootstrapAIAssistant = (options = {}) => {
  // 1. 创建模态框 (Modal)
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'ai-modal-overlay';
  modalOverlay.innerHTML = `
    <div class="ai-modal-content">
      <button class="ai-modal-close-btn">&times;</button>
      <div id="ai-container"></div>
    </div>
  `;
  document.body.appendChild(modalOverlay);

  // 2. 创建可拖拽的浮动操作按钮 (FAB)
  const fab = document.createElement('button');
  fab.id = 'ai-assistant-fab';
  fab.innerHTML = '&#x1F916;'; // Robot emoji as a placeholder icon
  document.body.appendChild(fab);

  // 3. 获取关键 DOM 元素
  const modalContent = modalOverlay.querySelector('.ai-modal-content');
  const closeBtn = modalOverlay.querySelector('.ai-modal-close-btn');
  const aiContainerId = '#ai-container';

  // 4. 模态框控制逻辑
  const openModal = () => {
    modalOverlay.style.display = 'flex';
    // 首次打开时初始化AI助手
    if (!isAssistantInitialized) {
      try {
        Logger.log("Initializing AI Assistant for the first time...");
        const serviceUrl = options.bffUrl || SETTINGS.service.url;
        appInstance = new AppController(serviceUrl);
        appInstance.init(aiContainerId);
        isAssistantInitialized = true;
        Logger.log("AI Assistant Initialized Successfully.");
      } catch (error) {
        Logger.error("A critical error occurred during initialization:", error);
        const container = document.querySelector(aiContainerId);
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
  };

  const closeModal = () => {
    modalOverlay.style.display = 'none';
  };

  closeBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
      closeModal();
    }
  });

  // 5. 浮动按钮拖拽和点击逻辑
  let isDragging = false;
  let wasDragged = false;
  let offsetX, offsetY;

  fab.addEventListener('mousedown', (e) => {
    isDragging = true;
    wasDragged = false;
    fab.style.cursor = 'grabbing';
    // 计算鼠标在按钮内的偏移量
    offsetX = e.clientX - fab.getBoundingClientRect().left;
    offsetY = e.clientY - fab.getBoundingClientRect().top;
    // 阻止默认的拖拽行为
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    wasDragged = true; // 标记为已拖拽
    // 计算新的位置
    let newX = e.clientX - offsetX;
    let newY = e.clientY - offsetY;

    // 限制在视窗内
    const fabRect = fab.getBoundingClientRect();
    newX = Math.max(0, Math.min(newX, window.innerWidth - fabRect.width));
    newY = Math.max(0, Math.min(newY, window.innerHeight - fabRect.height));

    fab.style.left = `${newX}px`;
    fab.style.top = `${newY}px`;
    // 清除固定的 right 和 bottom
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      fab.style.cursor = 'grab';
    }
  });

  fab.addEventListener('click', () => {
    // 只有在没有发生拖拽时才触发点击事件
    if (!wasDragged) {
      openModal();
    }
  });
};

// --- 自动执行 --- //

// 1. 在全局 window 对象上暴露一个配置点
// 允许用户在我们的脚本加载前定义一个全局配置变量
window.SmartFineReportConfig = window.SmartFineReportConfig || {};

// 2. 设置日志级别
Logger.setLevel(SETTINGS.logger.level);

// 3. DOM 加载完毕后，自动执行自举函数
document.addEventListener('DOMContentLoaded', () => {
  Logger.log("DOM fully loaded. Bootstrapping AI Assistant...");
  bootstrapAIAssistant(window.SmartFineReportConfig);
});

// 保留原始的导出，以防有旧的集成方式需要它，但这不再是主要用法
export const initAIAssistant = (options) => {
  Logger.warn("initAIAssistant is deprecated and will be removed in a future version. The AI Assistant now bootstraps automatically.");
  // 可以在这里决定是否还支持旧版初始化，或者直接忽略
  // 为了平滑过渡，我们可以手动调用新的 bootstrap
  if (!document.getElementById('ai-assistant-fab')) {
    bootstrapAIAssistant(options);
  }
};