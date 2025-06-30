# 🤖 智帆报表 (Smart FineReport Dashboard)

GitHub Repo: https://github.com/HaochenFa/Smart-FineReport

一个集成 AI 分析功能的帆软报表 (FineReport) 框架。该项目当前版本为 v1.1.0-vision，其核心思想是：通过捕获报表界面的截图，并将其发送给多模态大语言模型（vLLM
部署），从而实现对报表数据的智能分析。

## 核心功能

- 📸 **截图分析**：通过 `html2canvas` 等技术将当前报表视图渲染为图片，并将其作为核心分析依据。
- 🤖 **多模态对话**：将用户提问和报表截图一同发送给多模态大模型，生成包含总结、洞察和建议的分析报告。
- 💬 **多轮次交互**：支持用户围绕报表截图和生成的分析报告，与 AI 进行多轮次的追问和探讨。
- 📊 **富文本展示**：支持 Markdown 格式的分析报告，包括代码高亮、图表（Mermaid）等，提供更清晰、专业的阅读体验。

## 部署方式

智帆报表 AI 助手设计为可嵌入式组件，部署到帆软环境主要涉及以下步骤：

- **构建前端脚本**：使用 Rollup 将项目文件打包成单一的 JavaScript 文件。
- **部署 BFF 服务**：将后端 BFF 服务部署到服务器，负责 API 密钥管理和请求代理。
- **在帆软中集成**：将构建好的前端脚本和必要的 HTML 结构嵌入到帆软报表或看板中。

### 环境变量配置

为了增强安全性，BFF (Backend for Frontend) 服务支持通过环境变量来配置 API KEY。您可以在 `bff/` 目录下创建一个 `.env`
文件，并按以下格式添加您的 API KEY：

```plaintext
LLM_API_KEYS=your_api_key_1,your_api_key_2
LLM_FALLBACK_URLS=http://127.0.0.1:8080,http://127.0.0.1:8081
```

- `LLM_API_KEYS`：一个以逗号分隔的 API KEY 列表。BFF 服务会根据 `LLM_FALLBACK_URLS` 的顺序，为每个请求附加对应的 KEY。
- `LLM_FALLBACK_URLS`：一个以逗号分隔的 vLLM 服务 URL 列表。BFF 服务会按顺序尝试连接，直到成功为止。

## 项目架构

### 架构设计

```mermaid
flowchart BT
    subgraph "External Service 外部服务"
        id0((BFF 后端代理服务))
        id_vLLM((vLLM 服务))
    end

    subgraph "Frontend Application 前端应用"
        id1[Utils 工具与配置]
        id2[Services 通用服务]
        id3[Integration 帆软集成]
        id4[Core 核心 AI 逻辑]
        id5[UI 界面]
        id6[App 应用控制]
        id7[Entry Point 模块入口]
    end

%% 依赖关系与请求流 (实线)
    id2 -- " API Request 发起API请求 " --> id0
    id1 --> id2
    id1 --> id3
    id1 --> id4
    id1 --> id6
    id2 --> id4
    id3 --> id4
    id4 --> id6
    id5 --> id6
    id6 --> id7
    id0 -- " Forward & Authenticate 转发并鉴权 " --> id_vLLM
%% 响应流 (虚线)
    id_vLLM -.->|" 返回AI结果 "| id0
    id0 -.->|" 返回给前端 "| id2
```

### 文件结构

```plaintext
/SmartFineReport
│
├── bff/                # Backend for Frontend service
│   ├── .gitignore
│   ├── index.js
│   ├── package-lock.json
│   └── package.json
├── docs/               # Project documentation
│   ├── DEPLOYMENT_GUIDE.md
│   └── v1.0-doc.md
├── public/             # Public assets and HTML entry
│   ├── index.html
│   ├── smart-fr-plugin.js
│   └── tailwindcss.js
└── src/                # Source files
   ├── main.js             # The Main Entrance
   ├── app/            # Application control and initialization
   │    ├── app-controller.js        # Core service
   │    └── state-manager.js         # UI <-> Backend bridging
   ├── core/           # Core AI and analysis logic
   │    ├── ai-analysis-pipeline.js  # AI service controller
   │    ├── context-manager.js       # Manage context (conversation)
   │    ├── vllm-interface.js        # Connect to vLLM service
   │    └── prompt-builder.js        # Build structured prompts
   ├── services/       # Common services
   │    └── api-service.js           # General API service wrapper
   ├── styles/         # Application styles
   │    ├── fab.css
   │    └── main.css
   ├── ui/             # User interface components
   │    ├── chat-view.js             # Basic chat window implementation
   │    └── ui-manager.js            # Control UI status
   └── utils/          # Utility functions and configs
        ├── default-prompt.js        # Prompt template
        ├── logger.js                # Logger
        └── settings.js              # Static config and secrets
```

## 版本历史与开发计划

项目当前处于 `v1.1.0-vision` 阶段，核心的视觉分析功能已开发完成。后续计划将聚焦于稳定性和用户体验提升。

### v1.0: 视觉分析核心 (已完成)

-   [x] **核心框架**: 完成了基于截图和多模态模型的 AI 分析流程。
-   [x] **前端界面**: 开发了可嵌入的、由状态驱动的聊天 UI 组件。
-   [x] **后端代理 (BFF)**: 建立了用于 API 密钥管理和安全请求转发的 BFF 服务。
-   [x] **构建与样式**: 集成了 Rollup 打包流程和 Tailwind CSS，并解决了样式隔离问题。

### v1.1.0-vision 优化与新增功能

-   [x] **环境部署与测试**:
    -   [x] 部署到内部测试环境，进行全面的功能验证。
    -   [ ] 部署到预生产环境，与真实的帆软看板进行集成测试。
-   [x] **UI/UX 优化**:
    -   [x] **富文本支持**：实现了 Markdown、代码高亮和 Mermaid 图表渲染。
    -   [x] **响应式布局**：优化了弹窗和输入框的响应式布局，提升了在不同屏幕尺寸下的可用性。
    -   [x] **消息气泡设计**：重新设计了聊天消息气泡，更清晰地区分用户、AI 和系统消息。
    -   [x] **输入区域现代化**：更新了输入框和按钮的样式，并优化了“重置”按钮的布局。
    -   [x] 进一步优化 UI 布局和交互细节，提升用户体验。
    -   [x] 增强 UI 对不同尺寸看板和屏幕的响应式适配能力。

## 生产环境部署

项目的部署包含三个核心步骤：部署后端 BFF 服务、构建前端脚本、在帆软中集成。

### 步骤 1: 部署 BFF 后端服务

BFF (Backend for Frontend) 是一个独立的 Node.js 服务，负责安全地管理 API 密钥和代理请求。**必须将其部署在服务器环境中**。

1. **上传文件**: 将项目根目录下的 `bff/` 文件夹完整上传到您的服务器。
2. **配置环境变量**: 进入服务器的 `bff/` 目录，创建一个 `.env` 文件，并配置以下变量：
   ```plaintext
   # .env
   LLM_API_KEYS=your_api_key_1,your_api_key_2
   LLM_FALLBACK_URLS=http://vllm-service-1.com,http://vllm-service-2.com
   ```
3. **安装依赖**: 在服务器的 `bff/` 目录中执行：
   ```bash
   npm install
   ```
4. **启动服务**: 为了保证服务稳定性，推荐使用进程守护工具 `pm2`。
   ```bash
   # 全局安装 pm2 (如果尚未安装)
   npm install -g pm2

   # 使用 pm2 启动服务
   pm2 start index.js --name "smart-finereport-bff"
   ```
   请确保 BFF 服务所在的端口（默认为 3001）已在防火墙中开放，并记录下其访问地址，例如 `http://your-server-ip:3001`。

### 步骤 2: 构建前端脚本

在您的**本地开发环境**中执行以下操作。

1. **配置 BFF 地址**: 打开 `src/utils/settings.js` 文件，修改 `SETTINGS.service.url` 的值，使其指向您在上一步中部署的 BFF
   服务地址。
2. **执行构建**: 在项目根目录下运行打包命令：
   ```bash
   npm run build
   ```
3. **获取产物**: 构建成功后，在 `dist/` 目录下找到 `smart-finereport.umd.js` 文件。请注意，此 UMD 文件已将 `mermaid` 和
   `highlight.js` 外部化，因此您需要在 HTML 中单独引入它们。
   将此文件上传到 CDN 或帆软服务器的静态资源目录，确保能通过 URL 公开访问。

### 步骤 3: 在帆软中集成

智帆报表 AI 助手设计为在页面加载后自动启动。您只需在帆软报表或看板的 HTML 模板中引入必要的脚本和样式。

1. **添加容器**: 在帆软看板设计器中，拖入一个 HTML 组件，并写入以下内容以创建挂载点。聊天窗口将在此渲染。
   ```html
   <div id="smartfine-chat-container"></div>
   ```
2. **引入核心脚本和外部依赖**:
   将以下脚本和样式链接添加到帆软报表或看板的 HTML 模板中（建议在 `<head>` 或 `<body>` 标签的顶部）。
   请确保 `smart-finereport.umd.js` 的路径正确，并替换为您的实际部署地址。

   ```html
   <!-- 引入 highlight.js 和 Mermaid.js -->
   <script src="https://cdn.jsdelivr.net/npm/mermaid@latest/dist/mermaid.min.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/highlight.js@latest/highlight.min.js"></script>

   <!-- 可选：配置 AI 助手。在 smart-finereport.umd.js 之前定义 -->
   <script>
     window.SmartFineReportConfig = {
       bffUrl: 'http://your-bff-service-url:3001' // 替换为您的 BFF 服务地址
     };
   </script>

   <!-- 引入智帆报表 AI 助手主脚本 -->
   <script src="https://your-cdn.com/path/to/smart-finereport.umd.js"></script>
   ```
   **说明**:
    - `window.SmartFineReportConfig` 是可选的全局配置对象，用于覆盖 `src/utils/settings.js` 中的默认设置，例如 BFF 服务的
      URL。
    - AI 助手将在页面 DOM 加载完成后自动初始化，无需额外的按钮点击事件。

**替代集成方式 (适用于开发或特定场景):**

如果您希望通过一个单一的入口点来加载所有资源（包括 CSS 和 JS），可以使用 `public/smart-fr-plugin.js`。
**注意**: `smart-fr-plugin.js` 默认硬编码了 `http://localhost:8080` 作为资源路径，这在生产环境中需要修改。

   ```html
   <!-- 引入 smart-fr-plugin.js -->
<script src="https://your-cdn.com/path/to/smart-fr-plugin.js"></script>
   ```

在使用此方式时，您可能需要修改 `smart-fr-plugin.js` 内部的资源路径，使其指向您实际部署的 CDN 或服务器地址。

## License

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。


