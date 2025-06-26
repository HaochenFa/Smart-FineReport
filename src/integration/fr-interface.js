/**
 * @file fr-interface.js
 * @author Haochen (Billy) Fa
 * @description Interface to FineReport Dashboard 与帆软交互的接口，封装帆软 API 的调用
 *
 * @import ../utils/logger.js
 */

/**
 * @typedef {object} FRSeriesItem Defines the structure of a series item in a chart. 定义了图表中一个系列项的结构。
 * @property {string} name The name of the series. 系列的名称。
 * @property {Array<number|string|null>} data The data points for the series. 系列的数据点。
 *
 * @typedef {object} FRChartData Defines the data structure returned by getChartData(). 定义了 getChartData() 返回的数据结构。
 * @property {string[]} categories Array of category labels for the chart axis. 图表轴的分类标签数组。
 * @property {FRSeriesItem[]} series Array of series data. 系列数据的数组。
 *
 * @typedef {object} FRChartWidget Defines a chart-like widget. 定义一个图表类组件。
 * @property {function(): FRChartData} getChartData Method to get chart data. 获取图表数据的方法。
 *
 * @typedef {object} FRTableData Defines the data structure for a table widget. 定义表格组件的数据结构。
 * @property {Array<Object<string, any>>} data Array of data row objects. 数据行对象的数组。
 *
 * @typedef {object} FRTableWidget Defines a table-like widget. 定义一个表格类组件。
 * @property {FRTableData} data The data payload of the table. 表格的数据负载。
 *
 * @typedef {FRChartWidget | FRTableWidget} FRWidget Represents any supported widget type. 代表任意受支持的组件类型。
 * @typedef {object} FRReport Defines the FR.Report object structure. 定义 FR.Report 对象的结构。
 * @property {function(string): (FRWidget | undefined)} getWidgetByName Method to get a widget by its name. 根据名称获取组件的方法。
 *
 * @typedef {object} FRGlobal Defines the global FR object structure. 定义全局 FR 对象的结构。
 * @property {FRReport} Report The Report API namespace. Report API 的命名空间。
 */

import {Logger as log} from "../utils/logger.js";

export class FRInterface {
  /**
   * The global FineReport instance, usually `window.FR`.
   * @type {object}
   * @private
   */
  fr;

  /**
   * @param {{Report: object}} frInstance - The global FineReport instance, which must contain the 'Report' property.
   * 帆软的全局实例，其中必须包含 'Report' 属性。
   */
  constructor(frInstance) {
    // Check if the provided instance is a valid FineReport object.
    // It should at least have the 'Report' property for dashboard operations.
    if (!frInstance || typeof frInstance.Report === "undefined") {
      const errorMsg = "Invalid or missing FineReport instance. Please provide the global 'FR' object from your dashboard environment.";
      log.error(errorMsg);
      throw new Error(errorMsg);
    }
    this.fr = frInstance;
    log.log("FRInterface initialized successfully.");
  }

  /**
   * @description async get all data from dashboard 异步获取报表中的所有数据
   * @param {string} widgetName - Name of the dashboard section 报表块名称
   * @return {Promise<Array<Array<string>>>} - 2d arr data 数据的二维数组
   */
  async getData(widgetName) {
    return new Promise((resolve, reject) => {
      try {
        log.log(`Attempting to retrieve data for widget: "${widgetName}"`);

        // Ensure the FR.Report API is available 确保 FR.Report API 可用。
        if (!this.fr.Report) {
          const errorMsg = "FR.Report API is not available. This function must be run within a FineReport dashboard (cpt) environment.";
          log.error(errorMsg);
          return reject(new Error(errorMsg));
        }

        // Get the widget instance by its name 根据名称获取组件实例。
        const widget = this.fr.Report.getWidgetByName(widgetName);

        // Handle case where the widget is not found 处理未找到组件的情况。
        if (!widget) {
          const warnMsg = `Widget "${widgetName}" could not be found in the dashboard.`;
          log.warn(warnMsg);
          // Resolve with an empty array, as this is a non-critical failure 解析为空数组，因为这不是一个关键性故障。
          return resolve([]);
        }

        let extractedData = [];

        // --- Data Extraction Logic --- // --- 数据提取逻辑 ---

        // Case 1: Handle Chart-like Widgets (e.g., Column, Line, Pie, Map, etc.).
        // 情况1：处理图表类组件（例如，柱形图、折线图、饼图、地图等）。
        // The most reliable way to identify a chart is by its `getChartData` method.
        // 识别图表最可靠的方法是检查其是否拥有 `getChartData` 方法。
        if (typeof widget.getChartData === "function") {
          log.log(`Widget "${widgetName}" identified as a chart. Using getChartData().`);
          const chartData = widget.getChartData();

          // Normalize the common chart data structure (categories/series) into a 2D array.
          // 将常见的图表数据结构（categories/series）规范化为二维数组。
          if (chartData && Array.isArray(chartData.series) && Array.isArray(chartData.categories)) {
            const headers = ["Category", ...chartData.series.map(s => s.name || "Series")];
            const categoryCount = chartData.categories.length;

            const dataRows = [];
            for (let i = 0; i < categoryCount; i++) {
              const row = [chartData.categories[i]];
              chartData.series.forEach(s => {
                // Ensure series data exists at the given index.
                // 确保系列数据在给定索引处存在。
                row.push(s.data && s.data.length > i ? s.data[i] : null);
              });
              dataRows.push(row);
            }
            extractedData = [headers, ...dataRows];
          }
        }
          // Case 2: Handle Table-like Widgets (Tables, CrossTables, etc.).
          // 情况2：处理表格类组件（表格、交叉表等）。
          // Data for these widgets is typically stored in `widget.data.data` as an array of objects.
        // 这些组件的数据通常以对象数组的形式存储在 `widget.data.data` 中。
        else if (widget.data && Array.isArray(widget.data.data) && widget.data.data.length > 0) {
          log.log(`Widget "${widgetName}" identified as a table/report block.`);
          const tableData = widget.data.data;

          // The keys of the first object are the headers 第一个对象的键即为表头。
          const headers = Object.keys(tableData[0]);
          const dataRows = tableData.map(rowObject =>
            headers.map(header => rowObject[header])
          );

          extractedData = [headers, ...dataRows];
        }
          // Fallback for other potential data structures.
        // 处理其他潜在数据结构的回退逻辑。
        else {
          log.warn(`Could not automatically determine data structure for widget "${widgetName}". It might be empty or of an unsupported type.`);
          // Return empty array if no data is found/extracted 如果没有找到或提取到数据，则返回空数组。
          return resolve([]);
        }

        // --- Finalization --- // --- 完成阶段 ---

        // Convert all extracted data cells to strings to match the return type hint.
        // 将所有提取的数据单元格转换为字符串，以匹配返回类型提示。
        const stringifiedData = extractedData.map(row =>
          row.map(cell =>
            (cell === null || cell === undefined) ? "" : String(cell)
          )
        );

        log.log(`Successfully extracted and processed data from widget: "${widgetName}"`);
        resolve(stringifiedData);

      } catch (error) {
        const errorMsg = `A critical error occurred while getting data for widget "${widgetName}": ${error.message}`;
        log.error(errorMsg, error);
        reject(new Error(errorMsg));
      }
    });
  }
}