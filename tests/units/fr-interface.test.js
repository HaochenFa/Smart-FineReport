/**
 * @file fr-interface.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for src/integration/fr-interface.js
 */

import {beforeAll, beforeEach, describe, expect, it, jest} from "@jest/globals";

// Module Variables 模块变量
let FRInterface;
let log;

// ESM Mocking Setup 兼容 ESM 的 Mocking
beforeAll(async () => {
  // Mock Logger first 先模拟 Logger
  jest.unstable_mockModule("@/utils/logger.js", () => ({
    Logger: {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  }));

  // Dynamically import modules after mocking 模拟后动态导入模块
  const frInterfaceModule = await import("@/integration/fr-interface.js");
  FRInterface = frInterfaceModule.FRInterface;

  const loggerModule = await import("@/utils/logger.js");
  log = loggerModule.Logger;
});

// Mock Data Setup 模拟数据设置
const mockChartWidget = {
  getChartData: () => ({
    categories: ["Jan", "Feb", "Mar"],
    series: [
      {name: "Sales", data: [100, 120, 150]},
      {name: "Profit", data: [40, 50, null]},
    ],
  }),
};

const mockTableWidget = {
  data: {
    data: [
      {'Product': 'Laptop', 'Region': 'East', 'Sales': 1000},
      {'Product': 'Mouse', 'Region': 'West', 'Sales': 1500},
      {'Product': 'Keyboard', 'Region': 'East', 'Sales': undefined},
    ],
  },
};

const mockEmptyWidget = {};

const createMockFrInstance = (widgets = {}) => ({
  Report: {
    getWidgetByName: jest.fn(widgetName => widgets[widgetName]),
  },
});

// Test Suite 测试组件
describe('FRInterface', () => {

  // Clear all mocks before each test to ensure a clean state.
  // 在每次测试前清除所有模拟，以确保测试环境的纯净。
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Constructor Tests --- //
  describe('Constructor', () => {
    it('should initialize successfully with a valid frInstance', () => {
      const mockFr = createMockFrInstance();
      const frInterface = new FRInterface(mockFr);
      expect(frInterface).toBeInstanceOf(FRInterface);
      expect(frInterface.fr).toBe(mockFr);
      expect(log.log).toHaveBeenCalledWith("FRInterface initialized successfully.");
    });

    it('should throw an error if frInstance is null or undefined', () => {
      const errorMsg = "Invalid or missing FineReport instance. Please provide the global 'FR' object from your dashboard environment.";
      expect(() => new FRInterface(null)).toThrow(errorMsg);
      expect(() => new FRInterface(undefined)).toThrow(errorMsg);
      expect(log.error).toHaveBeenCalledWith(errorMsg);
    });

    it('should throw an error if frInstance is missing the "Report" property', () => {
      const invalidFr = {SomeOtherProp: {}};
      const errorMsg = "Invalid or missing FineReport instance. Please provide the global 'FR' object from your dashboard environment.";
      expect(() => new FRInterface(invalidFr)).toThrow(errorMsg);
      expect(log.error).toHaveBeenCalledWith(errorMsg);
    });
  });


  // --- getData Method Tests --- //
  describe('getData', () => {
    const mockWidgets = {
      'myChart': mockChartWidget,
      'myTable': mockTableWidget,
      'unsupportedWidget': mockEmptyWidget,
    };
    const mockFr = createMockFrInstance(mockWidgets);

    it('should correctly extract and format data from a chart widget', async () => {
      const frInterface = new FRInterface(mockFr);
      const data = await frInterface.getData('myChart');

      const expectedData = [
        ['Category', 'Sales', 'Profit'],
        ['Jan', '100', '40'],
        ['Feb', '120', '50'],
        ['Mar', '150', ''], // null should be converted to an empty string
      ];

      expect(data).toEqual(expectedData);
      expect(mockFr.Report.getWidgetByName).toHaveBeenCalledWith('myChart');
      expect(log.log).toHaveBeenCalledWith('Widget "myChart" identified as a chart. Using getChartData().');
    });

    it('should correctly extract and format data from a table widget', async () => {
      const frInterface = new FRInterface(mockFr);
      const data = await frInterface.getData('myTable');

      const expectedData = [
        ['Product', 'Region', 'Sales'],
        ['Laptop', 'East', '1000'],
        ['Mouse', 'West', '1500'],
        ['Keyboard', 'East', ''], // undefined should be converted to an empty string
      ];

      expect(data).toEqual(expectedData);
      expect(mockFr.Report.getWidgetByName).toHaveBeenCalledWith('myTable');
      expect(log.log).toHaveBeenCalledWith('Widget "myTable" identified as a table/report block.');
    });

    it('should return an empty array for a non-existent widget', async () => {
      const frInterface = new FRInterface(mockFr);
      const data = await frInterface.getData('nonExistentWidget');

      expect(data).toEqual([]);
      expect(mockFr.Report.getWidgetByName).toHaveBeenCalledWith('nonExistentWidget');
      expect(log.warn).toHaveBeenCalledWith('Widget "nonExistentWidget" could not be found in the dashboard.');
    });

    it('should return an empty array for an unsupported widget type', async () => {
      const frInterface = new FRInterface(mockFr);
      const data = await frInterface.getData('unsupportedWidget');

      expect(data).toEqual([]);
      expect(mockFr.Report.getWidgetByName).toHaveBeenCalledWith('unsupportedWidget');
      expect(log.warn).toHaveBeenCalledWith('Could not automatically determine data structure for widget "unsupportedWidget". It might be empty or of an unsupported type.');
    });

    it('should reject the promise if a critical error occurs during execution', async () => {
      const error = new Error('Internal FR Engine Error');
      const errorMockFr = {
        Report: {
          getWidgetByName: jest.fn().mockImplementation(() => {
            throw error;
          }),
        },
      };

      const frInterface = new FRInterface(errorMockFr);

      // We expect the promise to be rejected with a new, more descriptive error.
      await expect(frInterface.getData('anyWidget')).rejects.toThrow('A critical error occurred while getting data for widget "anyWidget": Internal FR Engine Error');
      expect(log.error).toHaveBeenCalledWith(expect.stringContaining('A critical error occurred'), error);
    });

    it('should reject the promise if fr.Report API is not available at call time', async () => {
      const frInterface = new FRInterface(createMockFrInstance());
      // Manually simulate a scenario where the FR object becomes invalid after initialization
      frInterface.fr = {};

      const errorMsg = "FR.Report API is not available. This function must be run within a FineReport dashboard (cpt) environment.";

      await expect(frInterface.getData('anyWidget')).rejects.toThrow(errorMsg);
      expect(log.error).toHaveBeenCalledWith(errorMsg);
    });
  });
});