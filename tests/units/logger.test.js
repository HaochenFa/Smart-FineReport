/**
 * @file logger.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for src/utils/logger.js
 */

import {Logger} from "../../src/utils/logger.js";
import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";

describe('Logger', () => {
  let logSpy, warnSpy, errorSpy;

  // 在每个测试用例运行之前执行
  beforeEach(() => {
    // 使用 jest.spyOn 来“监视” console 的方法
    // .mockImplementation(() => {}) 会阻止原始方法的执行，避免测试输出混乱
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {
    });
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
    });
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
    });

    // 在每个测试前，重置日志级别为默认值 'log'
    // 这是为了确保测试的独立性
    Logger.setLevel('log');

    // 清除所有 mock 的调用记录，包括 setLevel 产生的日志
    jest.clearAllMocks();
  });

  // 在每个测试用例运行之后执行
  afterEach(() => {
    // 恢复所有被监视的方法到它们的原始实现
    jest.restoreAllMocks();
  });

  // 描述针对 setLevel 方法的测试
  describe('setLevel', () => {
    it('should set a valid log level and print a confirmation message', () => {
      Logger.setLevel('warn');
      // 验证 setLevel 是否打印了正确的确认信息
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('[Logger] Log level set to: WARN');
    });

    it('should handle uppercase level strings correctly', () => {
      Logger.setLevel('ERROR');
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('[Logger] Log level set to: ERROR');
    });

    it('should print an error message for an invalid log level', () => {
      Logger.setLevel('invalidLevel');
      // 验证对于无效级别，是否打印了错误信息
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        "[Logger] Invalid log level: INVALIDLEVEL. Please use one of 'LOG', 'WARN', 'ERROR', or 'NONE'."
      );
    });

    it('should not change the level if the provided level is invalid', () => {
      // 先设置为 'error'
      Logger.setLevel('error');
      logSpy.mockClear(); // 清除 setLevel('error') 的调用记录

      // 尝试设置一个无效级别
      Logger.setLevel('invalid');

      // 验证日志级别仍然是 'error'
      // Logger.log 不应该被调用
      Logger.log('This should not be logged');
      expect(logSpy).not.toHaveBeenCalled();

      // Logger.error 应该被调用
      Logger.error('This should be logged');
      expect(errorSpy).toHaveBeenCalledWith('This should be logged');
    });
  });

  // 描述在默认 'LOG' 级别下的行为
  describe('when level is LOG (default)', () => {
    it('should call console.log for Logger.log', () => {
      Logger.log('test log message');
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('test log message');
    });

    it('should call console.warn for Logger.warn', () => {
      Logger.warn('test warn message');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith('test warn message');
    });

    it('should call console.error for Logger.error', () => {
      Logger.error('test error message');
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith('test error message');
    });
  });

  // 描述在 'WARN' 级别下的行为
  describe('when level is WARN', () => {
    beforeEach(() => {
      // 在这个 'describe' 块的每个测试前，将级别设置为 'warn'
      Logger.setLevel('warn');
      jest.clearAllMocks(); // 清除 setLevel 产生的日志
    });

    it('should NOT call console.log for Logger.log', () => {
      Logger.log('test log message');
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should call console.warn for Logger.warn', () => {
      Logger.warn('test warn message');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith('test warn message');
    });

    it('should call console.error for Logger.error', () => {
      Logger.error('test error message');
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith('test error message');
    });
  });

  // 描述在 'ERROR' 级别下的行为
  describe('when level is ERROR', () => {
    beforeEach(() => {
      Logger.setLevel('error');
      jest.clearAllMocks();
    });

    it('should NOT call console.log for Logger.log', () => {
      Logger.log('test log message');
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should NOT call console.warn for Logger.warn', () => {
      Logger.warn('test warn message');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should call console.error for Logger.error', () => {
      Logger.error('test error message');
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith('test error message');
    });
  });

  // 描述在 'NONE' 级别下的行为
  describe('when level is NONE', () => {
    beforeEach(() => {
      Logger.setLevel('none');
      jest.clearAllMocks();
    });

    it('should NOT call any console method', () => {
      Logger.log('test log message');
      Logger.warn('test warn message');
      Logger.error('test error message');

      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});