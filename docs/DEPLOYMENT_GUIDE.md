### **智帆报表 (Smart FineReport) - 测试、部署与验证指南**

**目的**: 本指南为技术团队提供一个标准化的操作流程，涵盖项目的本地测试、生产打包、服务器部署，以及在帆软（FineReport）报表中的最终集成与验证。

**前置要求**:

* **本地环境**: Node.js (v18.x+), npm, Git
* **服务器环境**: Node.js, npm, pm2

---

### **阶段一：本地构建与验证**

此阶段在本地开发环境中进行，旨在验证模块功能并生成部署产物。

**步骤 1.1: 初始化项目**

```bash
# 1. 克隆项目代码库
git clone <your-repository-url>

# 2. 进入项目根目录
cd SmartFineReport/

# 3. 安装所有依赖包
npm install
```

**步骤 1.2: 搭建本地测试宿主页面**

本项目作为一个可嵌入模块，其本地开发与调试依赖于一个模拟宿主环境的 HTML 页面。

1. 在项目根目录，确保 `public` 文件夹存在。
2. 在 `public` 文件夹内，创建 `index.html` 文件并配置如下：

   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <title>SmartFineReport - Local Test</title>
       <link rel="stylesheet" href="/dist/smart-finereport.css">
       <style>
           body { font-family: sans-serif; padding: 20px; }
           #report-mock { border: 2px dashed #ccc; padding: 20px; margin-bottom: 20px; background-color: #f7f7f7; }
           #ai-container { border: 1px solid #000; }
           button { font-size: 16px; padding: 10px 15px; cursor: pointer; }
       </style>
   </head>
   <body>
       <h1>本地测试环境</h1>
       <div id="report-mock">
           <h2>模拟的报表区域</h2>
           <img src="https://via.placeholder.com/400x200.png?text=Sample+Chart" alt="Sample Chart">
       </div>
       <button id="ai-trigger-btn">启动 AI 分析助手</button>
       <div id="ai-container" style="width: 400px; height: 600px; margin-top: 20px;"></div>

       <script src="/dist/smart-finereport.umd.js"></script>
       <script>
           function _g() { return { reportName: "LocalTest" }; }
           document.getElementById('ai-trigger-btn').addEventListener('click', function() {
               if (window.SmartFineReport && window.SmartFineReport.initAIAssistant) {
                   window.SmartFineReport.initAIAssistant({
                       containerSelector: '#ai-container',
                       fineReportInstance: _g()
                   });
               } else {
                   console.error("SmartFineReport script not loaded or failed to initialize.");
               }
           });
       </script>
   </body>
   </html>
   ```

**步骤 1.3: 启动本地开发服务器**

此命令用于本地调试，它会启动一个服务并监视文件变化，实现热重载。

```bash
npm run dev
```

在浏览器中访问 `http://localhost:8080` 以进行本地测试。

**步骤 1.4: 执行生产打包**

此命令用于生成部署到生产环境的、经过优化和压缩的文件。

```bash
npm run build
```

**打包产物**:
此命令会在 `dist/` 目录下生成两个核心文件：

* `smart-finereport.umd.js`
* `smart-finereport.css`

---

### **阶段二：生产环境部署**

此阶段涉及将项目的前后端分别部署到服务器。

**步骤 2.1: 部署后端 BFF 服务**

1. **上传文件**: 将项目根目录下的 `bff/` 文件夹完整上传到目标服务器。
2. **配置环境变量**: 在服务器的 `bff/` 目录下创建 `.env` 文件，并配置 vLLM 服务地址及密钥。
   ```plaintext
   # /path/to/your/bff/.env
   LLM_API_KEYS=your_secure_api_key_1,your_secure_api_key_2
   LLM_FALLBACK_URLS=http://vllm-service-1.com/api,http://vllm-service-2.com/api
   ```
3. **安装生产依赖**: 在服务器的 `bff/` 目录下执行：
   ```bash
   npm install --production
   ```
4. **启动并守护服务**: 使用 `pm2` 启动并管理 BFF 服务进程。
   ```bash
   # 全局安装 pm2 (如果尚未安装)
   npm install -g pm2
   # 启动服务
   pm2 start index.js --name "smart-finereport-bff"
   # 验证服务状态
   pm2 list
   ```
5. **记录地址**: 确保 BFF 服务端口（默认为 **3001**）已在防火墙中开放，并记录其访问地址，例如 `http://YOUR_SERVER_IP:3001`。

**步骤 2.2: 部署前端产物**

1. **配置 BFF 地址**: 在本地代码中，打开 `src/utils/settings.js`，将 `url` 修改为指向已部署的 BFF 服务地址。
   ```javascript
   // src/utils/settings.js
   export const SETTINGS = {
     service: {
       url: "http://YOUR_SERVER_IP:3001/api/v1/", // <-- 修改为实际的 BFF 地址
     },
     // ...
   };
   ```
2. **重新打包**: 由于修改了配置，需再次运行构建命令。
   ```bash
   npm run build
   ```
3. **上传产物**: 将 `dist/` 目录下的 `smart-finereport.umd.js` 和 `smart-finereport.css` 文件上传到 CDN
   或服务器静态资源目录，并获取其公开访问 URL。

---

### **阶段三：帆软集成与端到端验证**

此阶段在帆软报表设计器中进行。

**步骤 3.1: 添加 AI 助手容器与样式**

1. 在帆软报表中，拖入一个 **“HTML”** 组件。
2. 双击该组件，在内容编辑器中粘贴以下代码，引入 CSS 并创建挂载点。
   ```html
   <!-- 1. 引入 CSS 文件 (请替换为实际 URL) -->
   <link rel="stylesheet" type="text/css" href="https://your-cdn.com/path/to/smart-finereport.css">

   <!-- 2. 创建 AI 助手的挂载容器 -->
   <div id="smartfine-chat-container"></div>
   ```

**步骤 3.2: 添加并配置触发按钮**

1. 拖入一个 **“按钮”** 组件。
2. 选中按钮，在 **“事件”** 标签页为“点击”事件添加 JavaScript。
3. 在弹出的代码编辑器中，粘贴以下代码：
   ```javascript
   // 脚本的公开访问 URL (请替换为实际 URL)
   const scriptUrl = 'https://your-cdn.com/path/to/smart-finereport.umd.js';

   if (window.SmartFineReport && window.SmartFineReport.initAIAssistant) {
     window.SmartFineReport.initAIAssistant({
       containerSelector: '#smartfine-chat-container',
       fineReportInstance: _g()
     });
   } else {
     const script = document.createElement('script');
     script.src = scriptUrl;
     script.onload = function() {
       window.SmartFineReport.initAIAssistant({
         containerSelector: '#smartfine-chat-container',
         fineReportInstance: _g()
       });
     };
     document.head.appendChild(script);
   }
   ```

**步骤 3.3: 端到端验证清单**

预览集成了 AI 助手的帆软报表，并进行最终验证：

1.  [ ] **加载验证**: 点击触发按钮。
2.  [ ] **UI 渲染**: AI 助手聊天窗口在指定容器中正确弹出。
3.  [ ] **首次分析**: 窗口中自动显示欢迎消息，并在短暂延迟后成功输出对当前报表的分析结果。
4.  [ ] **BFF 连接验证**: 检查浏览器开发者工具，确认前端向 BFF 服务发起的 API 请求返回了 200 状态码。若失败，请检查服务器端
    `pm2 logs`。
5.  [ ] **vLLM 连接验证**: 在 BFF 日志中，确认 BFF 服务成功连接到后端的 vLLM 服务。
6.  [ ] **多轮对话**: 在聊天窗口中输入追问，AI 能够结合上下文给出合理回答。