# **Smart FineReport - Testing, Deployment and Verification Guide**

**Language**: [中文](DEPLOYMENT_GUIDE.md) | [English](DEPLOYMENT_GUIDE_EN.md)

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

The project already provides a complete test page in `public/index.html`, including:

- Simulated sales analysis dashboard
- Chart.js chart examples
- Complete style configuration
- AI assistant integration examples

You can use this file directly for local testing or customize it as needed.

For detailed HTML code, please refer to the `public/index.html` file in the project.

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
