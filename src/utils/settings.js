/**
 * @file settings.js
 * @author Haochen (Billy) Fa
 * @description Static Config/Settings 存储静态的配置信息，如 API KEY、URL 等
 */

export const SETTINGS = {
  service: {
    vLLMService: "https://vllm.conpany.com/v1/chat/completion",
    API_KEY: "YOUR_API_KEY",
    model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B"
  },
  logger: {
    level: "log"
  },
};
