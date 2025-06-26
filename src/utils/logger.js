/**
 * @file logger.js
 * @author Haochen (Billy) Fa
 * @description 日志记录器
 */

export class Logger {
  static LEVELS = {
    LOG: 3,
    WARN: 2,
    ERROR: 1,
    NONE: 0,
  };

  static #currentLevel = Logger.LEVELS.LOG;

  /**
   * @description Logging Level 日志级别
   * @param {string} level - "none" <-> 0, "error" <-> 1, "warn" <-> 2, "log" <-> 3
   */
  static setLevel(level) {
    level = level.toUpperCase(); // 不区分大小写

    if (Logger.LEVELS[level] !== undefined) {
      Logger.#currentLevel = Logger.LEVELS[level];
      console.log(`[Logger] Log level set to: ${level}`);
    } else {
      console.error(
        `[Logger] Invalid log level: ${level}. Please use one of 'LOG', 'WARN', 'ERROR', or 'NONE'.`
      );
    }
  }

  /**
   * @description 输出标准信息日志。
   * @param {...any} args - 要输出的信息。
   */
  static log(...args) {
    if (Logger.#currentLevel >= Logger.LEVELS.LOG) {
      console.log(...args);
    }
  }

  /**
   * @description 输出警告信息日志。
   * @param {...any} args - 要输出的信息。
   */
  static warn(...args) {
    if (Logger.#currentLevel >= Logger.LEVELS.WARN) {
      console.warn(...args);
    }
  }

  /**
   * @description 输出错误信息日志。
   * @param {...any} args - 要输出的信息。
   */
  static error(...args) {
    if (Logger.#currentLevel >= Logger.LEVELS.ERROR) {
      console.error(...args);
    }
  }
}