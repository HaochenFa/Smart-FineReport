/**
 * @file main.js
 * @author Haochen (Billy) Fa
 * @description 主入口文件，实现AI助手的自举、UI动态注入和初始化。
 */

import App from "./App.svelte";
import {Logger} from "./utils/logger.js";
import {SETTINGS} from "./utils/settings.js";

import "./styles/main.css";
import "./styles/fab.css";

// 1. 设置日志级别
Logger.setLevel(SETTINGS.logger.level);

// 2. 确保DOM准备好后再挂载 Svelte 应用
let app;

function initializeApp() {
  if (document.body) {
    app = new App({
      target: document.body,
    });

    // 全局导出（用于浏览器环境）
    if (typeof window !== "undefined") {
      window.SmartFineReport = app;
    }
  } else {
    // 如果DOM还没准备好，等待一下再试
    setTimeout(initializeApp, 10);
  }
}

// 检查DOM状态
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

export default app;
