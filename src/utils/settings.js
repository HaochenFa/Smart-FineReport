/**
 * @file settings.js
 * @author Haochen (Billy) Fa
 * @description Static Config/Settings 存储静态的配置信息，如 API KEY、URL 等
 */

export const SETTINGS = {
  service: {
    url: [
      "http://placeholder-backend-api-address-1/api/v1/chat/completions", // 请替换为您的实际后端API地址
      "http://placeholder-backend-api-address-2/api/v1/generate", // 请替换为您的实际后端API地址
    ],
    proxy: "https://placeholder-proxy-address.com",
  },
  logger: {
    level: "log",
  },
};
