/**
 * @file main.js
 * @author Haochen (Billy) Fa
 * @description 主入口文件，实现AI助手的自举、UI动态注入和初始化。
 */

import App from "./App.svelte";
import { Logger } from "./utils/logger.js";
import { SETTINGS } from "./utils/settings.js";

// 1. 设置日志级别
Logger.setLevel(SETTINGS.logger.level);

// 2. 挂载 Svelte 应用
const app = new App({
  target: document.body,
});

export default app;
