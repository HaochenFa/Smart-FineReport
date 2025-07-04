/**
 * @file smart-fr-plugin.js
 * @author Jiaqi Liu
 * @description 模块在帆软报表的启动器
 */

function loadJS(src, callback) {
  const script = document.createElement('script');
  script.type = 'module';
  script.src = src;
  script.onload = callback;
  document.body.appendChild(script);
}

function loadCSS(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

window.onload = function () {
  const time = new Date()
  loadCSS(`/webroot/js/smart-finereport.cjs.min.css?V=${time.getTime()}`);
  loadJS(`/webroot/js/smart-finereport.cjs.min.js?V=${time.getTime()}`, function () {
    console.log('smart-finereport脚本加载完成');
  });
};