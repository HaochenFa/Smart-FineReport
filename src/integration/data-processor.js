/**
 * @file data-processor.js
 * @author Haochen (Billy) Fa
 * @description Clean raw data, convert to a formatted version 获取原始数据，进行数据清洗，转换为带格式的数据结构
 *
 * @import ../utils/logger.js
 * @import ./fr-interface.js
 */

/**
 * @typedef {object} WidgetConfigItem
 * @property {string} key - The key for this data in the final structured object. 在最终对象中的键名。
 * @property {string} name - The name of the widget in the FineReport dashboard. 在帆软报表中的组件名。
 * @property {'Table' | 'Chart' | 'CrossTable' | 'Map' | 'DashBoard'} type - The type of the widget. 组件的类型。
 */

import {Logger as log} from "../utils/logger.js";
import {FRInterface} from "./fr-interface.js";

export class DataProcessor {
  /**
   * @type {FRInterface}
   * @private
   */
  frInterface;

  /**
   * @param {FRInterface} frInterface - Instance 实例
   */
  constructor(frInterface) {
    if (!(frInterface instanceof FRInterface)) {
      const errorMsg = "DataProcessor requires a valid instance of FRInterface.";
      log.error(errorMsg);
      throw new TypeError(errorMsg);
    }
    this.frInterface = frInterface;
    log.log("DataProcessor (V2) initialized successfully.");
  }

  /**
   * @description Converts a 2D array from a table widget into an array of objects.
   * 将来自表格组件的二维数组转换为对象数组。
   * @param {Array<Array<string>>} dataArray - The input 2D array. The first row must be headers.
   * @returns {Array<object>} An array of objects.
   * @private
   */
  _convertTableToObjectArray(dataArray) {
    if (!dataArray || dataArray.length < 2) {
      log.warn("Cannot convert table data: input is empty or contains only headers.");
      return [];
    }
    const headers = dataArray[0];
    const dataRows = dataArray.slice(1);
    return dataRows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = (index < row.length) ? row[index] : null;
      });
      return obj;
    });
  }

  /**
   * @description Collects and structures data from multiple FineReport widgets based on a configuration.
   * 根据一份配置，从多个帆软组件中收集并结构化数据。
   * @param {Array<WidgetConfigItem>} widgetConfig - An array of widget configurations. 组件配置数组。
   * @returns {Promise<object>} - An object structured according to the prompt template (e.g., { Table: {...}, Chart: {...} }).
   */
  async getStructuredData(widgetConfig) {
    log.log("Starting to collect and structure data based on the provided widget configuration.");

    // Initialize the final data structure based on the prompt template keys.
    // 基于提示词模板来初始化最终的数据结构。
    const structuredData = {
      Table: {},
      Chart: {},
      CrossTable: {},
      DashBoard: {},
      Map: {},
    };

    if (!Array.isArray(widgetConfig) || widgetConfig.length === 0) {
      log.warn("Widget configuration is empty or invalid. Returning empty data structure.");
      return structuredData;
    }

    try {
      // Create an array of promises to fetch and process data for each widget.
      const dataPromises = widgetConfig.map(async (item) => {
        log.log(`Requesting data for widget "${item.name}" (type: ${item.type}, key: ${item.key}).`);

        // Fetch the raw 2D array data.
        const rawDataArray = await this.frInterface.getData(item.name);

        let processedData;

        // Process data based on widget type.
        // 根据组件类型差异化处理数据。
        switch (item.type) {
          case 'Table':
            // Tables are best represented as an array of objects.
            processedData = this._convertTableToObjectArray(rawDataArray);
            break;

          case 'Chart':
            // For charts, an array of objects is also a reasonable flat structure.
            // Advanced implementation could try to reconstruct {categories, series}.
            // 对于图表，对象数组也是合理的扁平结构。高级实现可以尝试重建 {categories, series}。
            processedData = this._convertTableToObjectArray(rawDataArray);
            break;

          case 'CrossTable':
            // For Cross Tables, preserving the 2D array structure is crucial as it retains row/column relationships.
            // The LLM is better at parsing this structure than a flattened list.
            // 对于交叉表，保留二维数组结构至关重要，因为它保留了行列关系。LLM 更擅长解析这种结构。
            processedData = rawDataArray;
            break;

          case 'Map':
          case 'DashBoard':
          default:
            // For other or unknown types, we default to a simple object array representation.
            // 对于其他或未知类型，我们默认使用简单的对象数组表示。
            log.warn(`Unhandled widget type "${item.type}" for key "${item.key}". Processing as a standard table.`);
            processedData = this._convertTableToObjectArray(rawDataArray);
            break;
        }

        return {...item, data: processedData};
      });

      const results = await Promise.all(dataPromises);

      // Assemble the final structured object from the array of results.
      results.forEach(result => {
        if (result.data && (!Array.isArray(result.data) || result.data.length > 0)) {
          // Ensure the type category exists in the final object.
          if (!structuredData[result.type]) {
            structuredData[result.type] = {};
          }
          structuredData[result.type][result.key] = result.data;
          log.log(`Successfully processed and added data for key "${result.key}" under type "${result.type}".`);
        } else {
          log.warn(`No data was processed for key "${result.key}" (from widget "${result.name}"). It will be omitted.`);
        }
      });

      // Clean up empty type categories
      // 清理掉空的类型分类
      Object.keys(structuredData).forEach(key => {
        if (Object.keys(structuredData[key]).length === 0) {
          delete structuredData[key];
        }
      });

      log.log("Successfully collected and structured all data.");
      return structuredData;

    } catch (error) {
      log.error(`A critical error occurred in getStructuredData: ${error.message}`, error);
      throw error;
    }
  }
}