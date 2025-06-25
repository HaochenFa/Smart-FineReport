/**
 * @file index.js
 * @author Haochen (Billy) Fa
 * @description BFF Main
 */

// 1. 导入所需模块
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

// 2. 初始化 Express 应用
const app = express();

// 3. 从环境变量中获取配置
const PORT = process.env.PORT || 3001;
// 读取逗号分隔的 URL 列表，并切分为一个数组
const llmUrls = (process.env.LLM_FALLBACK_URLS || '').split(',').filter(url => url);
const apiKeys = (process.env.LLM_API_KEYS || '').split(',').filter(key => key);

// 4. 基本配置与前置检查
if (llmUrls.length === 0) {
  console.error("FATAL ERROR: LLM_FALLBACK_URLS must be defined in the .env file and contain at least one URL.");
  process.exit(1);
}

console.log('[BFF] Fallback chain initialized with the following models (in order of priority):');
llmUrls.forEach((url, index) => {
  console.log(`  ${index + 1}: ${url}`);
});

// 5. 使用中间件
app.use(cors());
app.use(express.json());

// 6. 定义统一的 API 端点
app.post('/api/v1/chat', async (req, res) => {
  const requestBody = req.body;
  console.log('[BFF] Received request from client. Starting fallback chain.');
  console.log('[BFF] Request body:', JSON.stringify(requestBody, null, 2));

  // 7. 遍历回退 URL 阵列，实现责任链模式
  for (let i = 0; i < llmUrls.length; i++) {
    const targetUrl = llmUrls[i];
    const modelNumber = i + 1;

    try {
      console.log(`[BFF] Attempting to contact Model #${modelNumber}: ${targetUrl}`);

      // 8. 准备请求
      const headers = {'Content-Type': 'application/json'};
      if (apiKeys[i]) {
        headers['Authorization'] = `Bearer ${apiKeys[i]}`;
      }

      // 9. 发起请求
      const llmResponse = await axios.post(targetUrl, requestBody, {
        headers, timeout: 15000 // 设置15秒超时，防止请求卡死
      });

      // 10. 如果请求成功，立即将结果返回给前端，并终止循环
      console.log(`[BFF] Success from Model #${modelNumber}. Sending response to client.`);
      return res.status(200).json(llmResponse.data);

    } catch (error) {
      // 11. 如果当前模型调用失败，记录错误并准备尝试下一个
      console.warn(`[BFF] Model #${modelNumber} (${targetUrl}) failed.`, error.message);

      // 如果这是最后一个模型，并且它也失败了，则向前端返回最终的错误
      if (i === llmUrls.length - 1) {
        console.error('[BFF] All models in the fallback chain failed. Returning final error to client.');

        if (error.response) {
          // 如果是模型返回了错误状态码
          return res.status(error.response.status).json({
            message: 'All fallback models failed. Last error from model.', details: error.response.data
          });
        } else if (error.code === 'ECONNABORTED') {
          // 如果是超时错误
          return res.status(504).json({message: 'Gateway Timeout: All fallback models timed out.'});
        } else {
          // 如果是网络错误或其他问题
          return res.status(502).json({message: 'Bad Gateway: Could not connect to any of the fallback models.'});
        }
      }
      // 如果不是最后一个模型，循环将继续，尝试下一个
    }
  }
});

// 12. 启动服务器
app.listen(PORT, () => {
  console.log(`[BFF] High-Availability Gateway is running on http://localhost:${PORT}`);
});