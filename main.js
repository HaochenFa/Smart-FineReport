/**
 * @file main.js
 * @author Haochen (Billy) Fa
 * @description 主入口文件，将整个项目暴露给帆软
 */

import AppController from "@/app/app-controller.js";
import {SETTINGS} from "@/utils/settings.js";
import {Logger} from "@/utils/logger.js";

// 1. 在全局 window 对象上定义唯一的初始化方法
/**
 * @function window.initAIAssistant - 全局初始化函数
 * @param {object} options - 初始化配置
 * @param {string} options.containerSelector - 一个CSS选择器，指向用于挂载AI助手UI的DOM容器
 * @param {object} options.fineReportInstance - 帆软环境传入的全局实例 (例如 _finereport 或 FR)
 */
window.initAIAssistant = (options) => {
  // 2. 设置日志级别
  Logger.setLevel(SETTINGS.logger.level);

  // 3. 对传入参数进行校验，确保能正常启动
  if (!options || !options.containerSelector || !options.fineReportInstance) {
    Logger.error("AI Assistant Initialization Failed: Invalid arguments.");
    return;
  }

  try {
    Logger.log("Initializing AI Assistant...");

    // 实例化应用控制器，注入配置
    const app = new AppController(SETTINGS);

    // 调用 init 方法，传入 UI 挂载点和帆软实例
    app.init(options.containerSelector, options.fineReportInstance);
    Logger.log("AI Assistant Initialized Successfully.");
  } catch (error) {
    Logger.error("A critical error occurred during initialization:", error);
    // todo)) 考虑在 UI 界面上加入友好的错误信息，提示用户加载失败
  }
};