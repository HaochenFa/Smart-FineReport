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
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- <script src="https://cdn.tailwindcss.com"></script> -->
    <link rel="stylesheet" href="../dist/smart-finereport.cjs.min.css">
    <script type="module" src="../dist/smart-finereport.cjs.min.js"></script>
    <!-- <script type="module" src="./smart-fr-plugin.js"></script> -->

    <style>
        body {
            font-family: sans-serif;
            padding: 20px;
            background-color: #f0f2f5;
        }

        #report-mock {
            border: 1px solid #d9d9d9;
            padding: 20px;
            margin-bottom: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        #report-mock h2 {
            text-align: center;
            margin-bottom: 25px;
            font-size: 24px;
            color: #333;
        }

        .grid-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }

        .grid-item {
            background-color: #fff;
            padding: 20px;
            border: 1px solid #e8e8e8;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .grid-item.chart-large {
            grid-column: span 2;
        }

        .grid-item.table-full {
            grid-column: span 3;
        }

        .kpi {
            text-align: center;
        }

        .kpi h4 {
            margin: 0 0 10px 0;
            font-size: 1em;
            color: #555;
        }

        .kpi p {
            margin: 0;
            font-size: 2em;
            font-weight: bold;
            color: #1890ff;
        }

        .chart h4, .table-container h4 {
            margin-top: 0;
            margin-bottom: 15px;
        }

        .chart canvas {
            max-width: 100%;
            height: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }

        th {
            background-color: #f2f2f2;
            font-weight: 600;
        }

        tbody tr:nth-child(odd) {
            background-color: #fafafa;
        }
    </style>

</head>
<body>
<h1>本地测试环境</h1>
<div id="report-mock">
    <!-- The trigger button is now injected by the script -->
    <h2>销售分析仪表板</h2>
    <div class="grid-container">
        <div class="grid-item kpi">
            <h4>总销售额</h4>
            <p>¥1,234,567</p>
        </div>
        <div class="grid-item kpi">
            <h4>平均订单价值</h4>
            <p>¥890.12</p>
        </div>
        <div class="grid-item kpi">
            <h4>新客户</h4>
            <p>1,234</p>
        </div>
        <div class="grid-item chart chart-large">
            <h4>月度销售趋势</h4>
            <canvas id="salesTrendChart"></canvas>
        </div>
        <div class="grid-item chart">
            <h4>产品类别分布</h4>
            <canvas id="productCategoryChart"></canvas>
        </div>
        <div class="grid-item table-full table-container">
            <h4>区域销售明细</h4>
            <table>
                <thead>
                <tr>
                    <th>区域</th>
                    <th>销售额</th>
                    <th>同比增长</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>华东</td>
                    <td>¥450,000</td>
                    <td style="color: green;">+12%</td>
                </tr>
                <tr>
                    <td>华北</td>
                    <td>¥320,000</td>
                    <td style="color: green;">+8%</td>
                </tr>
                <tr>
                    <td>华南</td>
                    <td>¥280,000</td>
                    <td style="color: red;">-2%</td>
                </tr>
                <tr>
                    <td>华西</td>
                    <td>¥180,000</td>
                    <td style="color: green;">+15%</td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- The AI Assistant and its Modal are now injected by the script -->

<!-- <link rel="stylesheet" href="../dist/esm/main.css"> -->
<!-- <script type="module" src="../dist/esm/main.js"></script> -->
<script type="module" src="./smart-fr-plugin.js"></script>
<script>
    // Chart.js Initialization
    document.addEventListener('DOMContentLoaded', function () {
        // Sales Trend Chart (Bar)
        const salesCtx = document.getElementById('salesTrendChart').getContext('2d');
        new Chart(salesCtx, {
            type: 'bar',
            data: {
                labels: ['一月', '二月', '三月', '四月', '五月', '六月'],
                datasets: [{
                    label: '月度销售额 (万元)',
                    data: [65, 59, 80, 81, 56, 55],
                    backgroundColor: 'rgba(24, 144, 255, 0.6)',
                    borderColor: 'rgba(24, 144, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Product Category Chart (Pie)
        const productCtx = document.getElementById('productCategoryChart').getContext('2d');
        new Chart(productCtx, {
            type: 'pie',
            data: {
                labels: ['电子产品', '家居用品', '户外运动', '图书音像'],
                datasets: [{
                    label: '产品类别分布',
                    data: [300, 150, 100, 80],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true
            }
        });
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
此命令会在 `dist/` 目录下生成多个核心文件：

* `smart-finereport.cjs.min.js` (CommonJS 格式)
* `smart-finereport.esm.min.js` (ES Module 格式)
* `~.cjs.min.css` & `~.esm.min.css` (CSS 样式)

---

### **阶段二：生产环境部署**

此阶段涉及将项目部署到服务器。

**步骤 2.1: 构建前端脚本**

在您的**本地开发环境**中执行以下操作。

1. **配置后端 API 地址**: 打开 `src/utils/settings.js` 文件，修改 `SETTINGS.service.url` 的值，使其指向您的实际后端 API
   地址数组。

```javascript
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
```

2. **执行构建**: 在项目根目录下运行打包命令：

```bash
   npm run build
```

3. **获取产物**: 构建成功后，`dist/` 目录下会生成 `smart-finereport.cjs.min.js`，`smart-finereport.esm.min.js`，
   `~.cjs.min.css` & `~.esm.min.css`。

### **阶段三：文件部署与帆软集成**

1. **部署文件**: 将 `smart-finereport.cjs.min.js`、`smart-finereport.esm.min.js` 目录、`public/smart-fr-plugin.js` 和
   `style/tailwind.js`
   文件复制到您服务器上的一个公共可访问文件夹中，例如 `your_server_root/public/smartfinereport/`。

2. **帆软设计器配置**: 在帆软设计器中，点击顶部菜单栏的 `服务器 -> 服务器配置`。分别在“引入JavaScript文件”和“引入CSS文件”选项卡中进行配置。

3. **引入路径**: 在弹出的对话框中，分别输入您部署的 JavaScript 和 CSS 文件的绝对路径。例如，如果您的文件部署在
   `your_server_root/public/smartfinereport/`，则 JavaScript 文件输入
   `/public/smartfinereport/smart-finereport.cjs.min.js`，CSS 文件输入
   `/public/smartfinereport/smart-finereport.cjs.min.css` (如果存在)。

4. **验证**: 部署完成后，预览您的帆软报表，验证 AI 助手功能是否正常加载和运行。
