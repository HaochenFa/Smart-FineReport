/**
 * @file api-service.js
 * @author Haochen (Billy) Fa
 * @description FETCH Wrapper, standardize POST requests
 * @description 封装全局 fetch API，提供 POST 请求的标准化方法
 *
 * @import ../utils/logger.js
 */

import {Logger as log} from "../utils/logger.js";

export class APIService {
  /**
   * @description Send POST request with `async/await` 异步发送 POST 请求
   *
   * @param {string} url - URL
   * @param {object} body - Request body that will be converted to JSON 将要转换为 JSON 的请求体
   * @param {object} headers - Customized request header 自定义请求头
   *
   * @return {Promise<object>} - Analyzed JSON response 返回值
   */
  static async post(url, body, headers) {
    const defaultHeader = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    const requestOptions = {
      method: 'POST',
      headers: new Headers({...defaultHeader, ...headers}),
      body: JSON.stringify(body),
    };

    try {
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const errorData = {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        };
        try {
          errorData.body = await response.json();
        } catch (e) {
          errorData.body = 'Could not parse error response body as JSON.';
        }
        throw new Error(`HTTP error: ${response.status}. Details: ${JSON.stringify(errorData)}`);
      }

      return await response.json();

    } catch (error) {
      log.error('APIService POST Error:', error.message);
      throw error;
    }
  }
}