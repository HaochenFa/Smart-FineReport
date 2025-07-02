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

loadCSS('http://localhost:8080/dist/smart-finereport.min.css');

loadJS('http://localhost:8080/dist/smart-finereport.min.js', function () {
  console.log('smart-finereport脚本加载完成');
});