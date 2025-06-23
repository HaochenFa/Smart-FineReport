# 帆软 API、方法、及属性查找表

- 获取面板所有组件（Widget）

```js
_g().getAllWidgets()
```

- 获取面板组件名

```js
_g().getAllWidgets() // 获取对象数组 -> widgetName 属性
```

- 组件隐藏属性：`invisible`，存放在 `widget_name -> options -> invisible`

```js
_g().getWidgetByName('widget').options.invisible
```

- 获取特定组件数据

```js
window.FR.Chart.WebUtils.getChart('widget').chart.options.series
```

- 获取特定组件图表类型

```js
window.FR.Chart.WebUtils.getChart('widget').chart.options.chartType
```