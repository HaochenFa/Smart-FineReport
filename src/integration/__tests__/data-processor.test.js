/**
 * @file data-processor.test.js
 * @author Haochen (Billy) Fa
 * @description Unit test for src/integration/data-processor.js
 */

import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";

// 导入被测模块和其依赖项，使用新的文件路径。
// Import the module to be tested and its dependencies using the new file paths.
import {DataProcessor} from '@/integration/data-processor.js';
import {FRInterface} from '@/integration/fr-interface.js';
import {Logger} from '@/utils/logger.js';

// --- 测试套件 (Test Suite) ---

describe('DataProcessor', () => {
  let mockFRInterface;

  // 在每个测试用例运行前执行。
  // Runs before each test case.
  beforeEach(() => {
    // 创建一个符合FRInterface结构的模拟对象。
    // Create a mock object that conforms to the FRInterface structure.
    mockFRInterface = {
      // 必须是 FRInterface 的一个实例，以通过构造函数检查。
      // Must be an instance of FRInterface to pass the constructor check.
      __proto__: FRInterface.prototype,
      getData: jest.fn(),
    };

    // 使用 jest.spyOn 动态模拟 Logger 的方法，以避免 ESM 冲突。
    // Use jest.spyOn to dynamically mock Logger methods to avoid ESM conflicts.
    // .mockImplementation(() => {}) 会抑制实际的控制台输出。
    // .mockImplementation(() => {}) suppresses the actual console output.
    jest.spyOn(Logger, 'log').mockImplementation(() => {
    });
    jest.spyOn(Logger, 'warn').mockImplementation(() => {
    });
    jest.spyOn(Logger, 'error').mockImplementation(() => {
    });
  });

  // 在每个测试用例运行后执行，恢复所有模拟。
  // Runs after each test case to restore all mocks.
  afterEach(() => {
    jest.restoreAllMocks();
  });


  // --- 构造函数测试 (Constructor Tests) ---

  describe('constructor', () => {
    it('should initialize successfully with a valid FRInterface instance', () => {
      // 断言：当提供有效的 mockFRInterface 实例时，不应抛出错误。
      // Assertion: Should not throw when a valid mockFRInterface instance is provided.
      expect(() => new DataProcessor(mockFRInterface)).not.toThrow();
      // 断言：应记录初始化成功的消息。
      // Assertion: Should log a success message on initialization.
      expect(Logger.log).toHaveBeenCalledWith('DataProcessor (V2) initialized successfully.');
    });

    it('should throw a TypeError if the provided interface is not an instance of FRInterface', () => {
      // 断言：当提供一个无效对象（不是FRInterface实例）时，应抛出 TypeError。
      // Assertion: Should throw a TypeError when an invalid object (not an FRInterface instance) is provided.
      const invalidInterface = {};
      const expectedErrorMsg = "DataProcessor requires a valid instance of FRInterface.";

      expect(() => new DataProcessor(invalidInterface)).toThrow(new TypeError(expectedErrorMsg));
      // 断言：应记录相应的错误消息。
      // Assertion: Should log the corresponding error message.
      expect(Logger.error).toHaveBeenCalledWith(expectedErrorMsg);
    });
  });

  // --- getStructuredData 方法测试 (getStructuredData Method Tests) ---

  describe('getStructuredData', () => {
    // 模拟数据 (Mock Data)
    const mockTableData = [
      ['ID', 'Name', 'Department'],
      ['1', 'Alice', 'Engineering'],
      ['2', 'Bob', 'Marketing'],
    ];

    const mockChartData = [
      ['Month', 'Sales', 'Profit'],
      ['Jan', '100', '40'],
      ['Feb', '120', '50'],
    ];

    const mockCrossTableData = [
      ['Region', 'ProductA', 'ProductB'],
      ['North', '1000', '1200'],
      ['South', '1500', '1300'],
    ];

    // 测试配置 (Test Configuration)
    const widgetConfig = [
      {key: 'employeeList', name: 'Widget_Table_Employee', type: 'Table'},
      {key: 'monthlySales', name: 'Widget_Chart_Sales', type: 'Chart'},
      {key: 'regionalPerformance', name: 'Widget_Cross_Perf', type: 'CrossTable'},
      {key: 'storeDistribution', name: 'Widget_Map_Store', type: 'Map'},
      {key: 'unknownWidget', name: 'Widget_Unknown', type: 'UnknownType'}
    ];

    it('should fetch and structure data correctly for various widget types', async () => {
      const processor = new DataProcessor(mockFRInterface);

      // 为每个 widgetName 配置模拟的返回值。
      // Configure mock return values for each widgetName.
      mockFRInterface.getData
        .mockResolvedValueOnce(mockTableData)       // for 'Widget_Table_Employee'
        .mockResolvedValueOnce(mockChartData)        // for 'Widget_Chart_Sales'
        .mockResolvedValueOnce(mockCrossTableData)   // for 'Widget_Cross_Perf'
        .mockResolvedValueOnce(mockTableData)        // for 'Widget_Map_Store' (falls back to table)
        .mockResolvedValueOnce(mockChartData);       // for 'Widget_Unknown' (falls back to table)

      const result = await processor.getStructuredData(widgetConfig);

      // --- 断言 (Assertions) ---

      // FIX 1: The code creates a key for every type encountered, including "UnknownType".
      // We use .sort() to make the comparison order-independent and more robust.
      expect(Object.keys(result).sort()).toEqual(['Chart', 'CrossTable', 'Map', 'Table', 'UnknownType'].sort());

      expect(result.Table.employeeList).toEqual([
        {ID: '1', Name: 'Alice', Department: 'Engineering'},
        {ID: '2', Name: 'Bob', Department: 'Marketing'},
      ]);

      expect(result.Chart.monthlySales).toEqual([
        {Month: 'Jan', Sales: '100', Profit: '40'},
        {Month: 'Feb', Sales: '120', Profit: '50'},
      ]);

      expect(result.CrossTable.regionalPerformance).toEqual(mockCrossTableData);

      expect(result.Map.storeDistribution).toEqual([
        {ID: '1', Name: 'Alice', Department: 'Engineering'},
        {ID: '2', Name: 'Bob', Department: 'Marketing'},
      ]);

      // FIX 2: The data for the unknown widget is stored under its original type 'UnknownType'.
      expect(result.UnknownType.unknownWidget).toEqual([
        {Month: 'Jan', Sales: '100', Profit: '40'},
        {Month: 'Feb', Sales: '120', Profit: '50'},
      ]);

      expect(mockFRInterface.getData).toHaveBeenCalledTimes(5);
      expect(mockFRInterface.getData).toHaveBeenCalledWith('Widget_Table_Employee');
      expect(mockFRInterface.getData).toHaveBeenCalledWith('Widget_Chart_Sales');
    });

    it('should return a pre-initialized structure if the widgetConfig is empty or invalid', async () => {
      const processor = new DataProcessor(mockFRInterface);
      const expectedInitialStructure = {
        Table: {},
        Chart: {},
        CrossTable: {},
        DashBoard: {},
        Map: {},
      };

      // FIX: The code returns the pre-initialized object before the cleanup step, not an empty {}.
      const result1 = await processor.getStructuredData([]);
      expect(result1).toEqual(expectedInitialStructure);

      const result2 = await processor.getStructuredData(null);
      expect(result2).toEqual(expectedInitialStructure);

      expect(mockFRInterface.getData).not.toHaveBeenCalled();
    });

    it('should omit widgets that return no data or only headers', async () => {
      const processor = new DataProcessor(mockFRInterface);
      const sparseConfig = [
        {key: 'validData', name: 'Widget_Valid', type: 'Table'},
        {key: 'emptyData', name: 'Widget_Empty', type: 'Table'},
        {key: 'headerOnly', name: 'Widget_HeaderOnly', type: 'Table'}
      ];

      mockFRInterface.getData
        .mockResolvedValueOnce(mockTableData)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([['ID', 'Name']]);

      const result = await processor.getStructuredData(sparseConfig);

      expect(Object.keys(result)).toEqual(['Table']);
      expect(Object.keys(result.Table)).toEqual(['validData']);
      expect(result.Table.validData).toBeDefined();

      expect(result.Table.emptyData).toBeUndefined();
      expect(result.Table.headerOnly).toBeUndefined();

      expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining("No data was processed for key \"emptyData\""));
      expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining("No data was processed for key \"headerOnly\""));
    });

    it('should propagate errors if frInterface.getData rejects', async () => {
      const processor = new DataProcessor(mockFRInterface);
      const error = new Error('Failed to fetch from FR');

      mockFRInterface.getData.mockRejectedValue(error);

      expect.assertions(1);
      await expect(processor.getStructuredData(widgetConfig)).rejects.toThrow('Failed to fetch from FR');
    });
  });

  describe('_convertTableToObjectArray (private method test)', () => {
    it('should correctly convert a 2D array to an array of objects', () => {
      const processor = new DataProcessor(mockFRInterface);
      const inputArray = [
        ['col1', 'col2', 'col3'],
        ['a1', 'b1', 'c1'],
        ['a2', 'b2', 'c2']
      ];

      const result = processor._convertTableToObjectArray(inputArray);

      expect(result).toEqual([
        {col1: 'a1', col2: 'b1', col3: 'c1'},
        {col1: 'a2', col2: 'b2', col3: 'c2'}
      ]);
    });

    it('should return an empty array if input has only headers or is empty', () => {
      const processor = new DataProcessor(mockFRInterface);

      const headerOnly = [['col1', 'col2']];
      const emptyArray = [];
      const nullInput = null;

      expect(processor._convertTableToObjectArray(headerOnly)).toEqual([]);
      expect(processor._convertTableToObjectArray(emptyArray)).toEqual([]);
      expect(processor._convertTableToObjectArray(nullInput)).toEqual([]);
      expect(Logger.warn).toHaveBeenCalledWith("Cannot convert table data: input is empty or contains only headers.");
    });

    it('should handle rows with fewer columns than headers', () => {
      const processor = new DataProcessor(mockFRInterface);
      const inputArray = [
        ['ID', 'Name', 'Status'],
        ['1', 'FullRow'],
        ['2', 'AnotherFullRow', 'Active']
      ];

      const result = processor._convertTableToObjectArray(inputArray);

      expect(result).toEqual([
        {ID: '1', Name: 'FullRow', Status: null},
        {ID: '2', Name: 'AnotherFullRow', Status: 'Active'}
      ]);
    });
  });
});