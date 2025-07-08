/**
 * @file smart-fr-plugin.js
 * @author Jiaqi Liu
 * @description 模块在帆软报表的启动器
 */

/**
 * 注意：现在这些文件包含了 Svelte 编译后的 AI 助手应用程序及其样式。
 */
function loadJS(src, callback) {
  const script = document.createElement("script");
  script.type = "module";
  script.src = src;
  script.onload = callback;
  document.body.appendChild(script);
}

function loadCSS(href) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

window.onload = function () {
  const time = new Date();
  loadCSS(`/webroot/js/smart-finereport.cjs.min.css?V=${time.getTime()}`);
  loadJS(`/webroot/js/smart-finereport.cjs.min.js?V=${time.getTime()}`, function () {
    console.log("smart-finereport脚本加载完成");
  });
};
