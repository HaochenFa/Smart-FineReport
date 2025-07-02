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

       <script src="https://cdn.jsdelivr.net/npm/mermaid@latest/dist/mermaid.min.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/highlight.js@latest/highlight.min.js"></script>
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

* `cjs/` 目录 (CommonJS 格式)
* `esm/` 目录 (ES Module 格式)
* `smart-finereport.css` (如果您的项目中包含 CSS 提取)

---

### **阶段二：生产环境部署**

此阶段涉及将项目部署到服务器。

**步骤 2.1: 构建前端脚本**

在您的**本地开发环境**中执行以下操作。

1. **配置后端 API 地址**: 打开 `src/utils/settings.js` 文件，修改 `SETTINGS.service.url` 的值，使其指向您的实际后端 API
   地址数组。
   ```javascript
   // src/utils/settings.js
   export const SETTINGS = {
     service: {
       url: [
         "http://your-actual-backend-api-address-1/api/v1/", // <-- 修改为实际的后端 API 地址
         "http://your-actual-backend-api-address-2/api/v1/", // <-- 修改为实际的后端 API 地址
       ],
     },
     // ...
   };
   ```
2. **执行构建**: 在项目根目录下运行打包命令：
   ```bash
   npm run build
   ```
3. **获取产物**: 构建成功后，`dist/` 目录下会生成 `cjs/` 和 `esm/` 文件夹。

### **阶段三：文件部署与帆软集成**

1. **部署文件**: 将 `dist/cjs/` 目录、`dist/esm/` 目录、`public/smart-fr-plugin.js` 和 `public/tailwindcss.js`
   文件复制到您服务器上的一个公共可访问文件夹中，例如 `your_server_root/public/smartfinereport/`。

2. **帆软设计器配置**: 在帆软设计器中，点击顶部菜单栏的 `服务器 -> 服务器配置`。分别在“引入JavaScript文件”和“引入CSS文件”选项卡中进行配置。

3. **引入路径**: 在弹出的对话框中，分别输入您部署的 JavaScript 和 CSS 文件的绝对路径。例如，如果您的文件部署在
   `your_server_root/public/smartfinereport/`，则 JavaScript 文件输入 `/public/smartfinereport/smart-finereport.cjs.min.js`，CSS 文件输入 `/public/smartfinereport/smart-finereport.cjs.min.css`。

4. **验证**: 部署完成后，预览您的帆软报表，验证 AI 助手功能是否正常加载和运行。
