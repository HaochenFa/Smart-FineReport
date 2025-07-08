# **Smart FineReport - Testing, Deployment and Verification Guide**

**Purpose**: This guide provides technical teams with a standardized operational process covering local testing, production packaging, server deployment, and final integration and verification in FineReport.

**Prerequisites**:

- **Local Environment**: Node.js (v18.x+), npm, Git
- **Server Environment**: Node.js, npm, pm2

---

## **Phase 1: Local Build and Verification**

This phase is conducted in the local development environment to verify module functionality and generate deployment artifacts.

**Step 1.1: Initialize Project**

```bash
# 1. Clone the project repository
git clone <your-repository-url>

# 2. Enter the project root directory
cd SmartFineReport/

# 3. Install all dependencies
npm install
```

**Step 1.2: Set up Local Test Host Page**

This project serves as an embeddable module, and its local development and debugging depend on an HTML page that simulates the host environment.

1. In the project root directory, ensure the `public` folder exists.
2. In the `public` folder, create an `index.html` file and configure it as follows:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>SmartFineReport - Local Test</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- <script src="https://cdn.tailwindcss.com"></script> -->
    <link rel="stylesheet" href="../dist/smart-finereport.cjs.min.css" />
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

      .chart h4,
      .table-container h4 {
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

      th,
      td {
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
    <h1>Local Test Environment</h1>
    <div id="report-mock">
      <!-- The trigger button is now injected by the script -->
      <h2>Sales Analysis Dashboard</h2>
      <div class="grid-container">
        <div class="grid-item kpi">
          <h4>Total Sales</h4>
          <p>¥1,234,567</p>
        </div>
        <div class="grid-item kpi">
          <h4>Average Order Value</h4>
          <p>¥890.12</p>
        </div>
        <div class="grid-item kpi">
          <h4>New Customers</h4>
          <p>1,234</p>
        </div>
        <div class="grid-item chart chart-large">
          <h4>Monthly Sales Trend</h4>
          <canvas id="salesTrendChart"></canvas>
        </div>
        <div class="grid-item chart">
          <h4>Product Category Distribution</h4>
          <canvas id="productCategoryChart"></canvas>
        </div>
        <div class="grid-item table-full table-container">
          <h4>Regional Sales Details</h4>
          <table>
            <thead>
              <tr>
                <th>Region</th>
                <th>Sales</th>
                <th>YoY Growth</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>East China</td>
                <td>¥450,000</td>
                <td style="color: green;">+12%</td>
              </tr>
              <tr>
                <td>North China</td>
                <td>¥320,000</td>
                <td style="color: green;">+8%</td>
              </tr>
              <tr>
                <td>South China</td>
                <td>¥280,000</td>
                <td style="color: red;">-2%</td>
              </tr>
              <tr>
                <td>West China</td>
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
      document.addEventListener("DOMContentLoaded", function () {
        // Sales Trend Chart (Bar)
        const salesCtx = document
          .getElementById("salesTrendChart")
          .getContext("2d");
        new Chart(salesCtx, {
          type: "bar",
          data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [
              {
                label: "Monthly Sales (10k CNY)",
                data: [65, 59, 80, 81, 56, 55],
                backgroundColor: "rgba(24, 144, 255, 0.6)",
                borderColor: "rgba(24, 144, 255, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        });

        // Product Category Chart (Pie)
        const productCtx = document
          .getElementById("productCategoryChart")
          .getContext("2d");
        new Chart(productCtx, {
          type: "pie",
          data: {
            labels: [
              "Electronics",
              "Home & Garden",
              "Sports & Outdoors",
              "Books & Media",
            ],
            datasets: [
              {
                label: "Product Category Distribution",
                data: [300, 150, 100, 80],
                backgroundColor: [
                  "rgba(255, 99, 132, 0.7)",
                  "rgba(54, 162, 235, 0.7)",
                  "rgba(255, 206, 86, 0.7)",
                  "rgba(75, 192, 192, 0.7)",
                ],
                hoverOffset: 4,
              },
            ],
          },
          options: {
            responsive: true,
          },
        });
      });
    </script>
  </body>
</html>
```

**Step 1.3: Start Local Development Server**

This command is used for local debugging. It starts a service and monitors file changes for hot reloading.

```bash
npm run dev
```

Access `http://localhost:8080` in your browser for local testing.

**Step 1.4: Execute Production Build**

This command is used to generate optimized and compressed files for deployment to production environment.

```bash
npm run build
```

**Build Output**:
This command will generate multiple core files in the `public/dist/` directory:

- `smart-finereport.cjs.min.js` (CommonJS format)
- `smart-finereport.esm.min.js` (ES Module format)
- `smart-finereport.cjs.min.css` & `smart-finereport.esm.min.css` (CSS styles)

---

## **Phase 2: Production Environment Deployment**

This phase involves deploying the project to the server.

**Step 2.1: Build Frontend Scripts**

Perform the following operations in your **local development environment**.

1. **Configure Backend API Address**: Open the `src/utils/settings.js` file and modify the value of `SETTINGS.service.url` to point to your actual backend API address array.

```javascript
export const SETTINGS = {
  service: {
    url: [
      "http://placeholder-backend-api-address-1/api/v1/chat/completions", // Please replace with your actual backend API address
      "http://placeholder-backend-api-address-2/api/v1/generate", // Please replace with your actual backend API address
    ],
    proxy: "https://placeholder-proxy-address.com",
  },
  logger: {
    level: "log",
  },
};
```

2. **Execute Build**: Run the packaging command in the project root directory:

```bash
   npm run build
```

3. **Get Build Output**: After successful build, the `public/dist/` directory will generate `smart-finereport.cjs.min.js`, `smart-finereport.esm.min.js`,
   `smart-finereport.cjs.min.css` & `smart-finereport.esm.min.css`.

## **Phase 3: File Deployment and FineReport Integration**

1. **Deploy Files**: Copy `public/dist/smart-finereport.cjs.min.js`, `public/dist/smart-finereport.esm.min.js`, `public/smart-fr-plugin.js` and
   `src/styles/tailwind.js`
   files to a publicly accessible folder on your server, such as `your_server_root/public/smartfinereport/`.

2. **FineReport Designer Configuration**: In FineReport Designer, click `Server -> Server Configuration` in the top menu bar. Configure in the "Import JavaScript Files" and "Import CSS Files" tabs respectively.

3. **Import Path**: In the popup dialog, enter the absolute paths of your deployed JavaScript and CSS files respectively. For example, if your files are deployed in
   `your_server_root/public/smartfinereport/`, then enter JavaScript file as
   `/public/smartfinereport/smart-finereport.cjs.min.js`, CSS file as
   `/public/smartfinereport/smart-finereport.cjs.min.css` (if exists).

4. **Verification**: After deployment is complete, preview your FineReport reports to verify that the AI assistant functionality loads and runs normally.
