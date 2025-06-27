/**
 * @file main.js
 * @author Haochen (Billy) Fa
 * @description 主入口文件，将整个项目暴露给帆软
 */

import "./styles/main.css";
import AppController from "@/app/app-controller.js";
import {SETTINGS} from "@/utils/settings.js";
import {Logger} from "@/utils/logger.js";

// 1. 在全局 window 对象上定义唯一的初始化方法
/**
 * @function window.initAIAssistant - 全局初始化函数
 * @param {object} options - 初始化配置
 * @param {string} options.containerSelector - 一个CSS选择器，指向用于挂载AI助手UI的DOM容器
 * @param {string} options.bffUrl - (可选) 后端 BFF 服务的 URL
 * @param {object} options.fineReportInstance - 帆软环境传入的全局实例 (例如 _finereport 或 FR)
 */
export const initAIAssistant = (options) => {
  // 2. 设置日志级别
  Logger.setLevel(SETTINGS.logger.level);

  // 3. 对传入参数进行校验，确保能正常启动
  if (!options || !options.containerSelector) {
    Logger.error("AI Assistant Initialization Failed: `containerSelector` must be provided.");
    return;
  }

  // 将传入的 bffUrl 或默认的 settings.service.url 传递给控制器
  const serviceUrl = options.bffUrl || SETTINGS.service.url;

  try {
    Logger.log("Initializing AI Assistant...");

    const app = new AppController(serviceUrl);

    app.init(options.containerSelector);
    Logger.log("AI Assistant Initialized Successfully.");
  } catch (error) {
    Logger.error("A critical error occurred during initialization:", error);

    // 这里不尝试调用 `app.addMessage()`，因为 app 可能没有被正确实例化
    const container = document.querySelector(options.containerSelector);
    if (container) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #757575; font-family: sans-serif;">
          <p style="margin: 0; font-weight: 500;">AI 分析助手初始化失败</p>
          <p style="margin: 8px 0 0; font-size: 14px;">请检查控制台日志或联系技术支持。</p>
        </div>
      `;
    }
  }
};

// 将初始化函数暴露到全局 window 对象
window.initAIAssistant = initAIAssistant;