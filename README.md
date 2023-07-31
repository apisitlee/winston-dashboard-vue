# Winston Dashboard Vue

Vue3版本的winston日志看板。

## 启用方法
引入并调用`WinstonDashboardVue`方法。例如，在入口文件中：
```js
import WinstonDashboardVue from 'winston-dashboard-vue';

WinstonDashboardVue({
    port: 8801，
    storageDir: '/usr/local/wdv-storage.local'
});
```

> 其中，
> 参数 `port` 默认值是6688。
> 参数 `storageDir` 默认值是当前项目根目录下'storage.local'目录，用于记录日志平台使用信息。 如配置的目录在您项目目录下，清将此storage目录添加到.gitignore文件中。

开启服务后，即可在http://localhost:8801查看日志看板界面了。


## 看板使用说明
看板分为“首页”和“配置”两个页面。

### 首页
默认进入的是首页。首页展示日志列表，列表上方可以切换不同的日志数据源。默认未配置数据源，请在“配置”页面添加数据源配置。

列表顶部有一些筛选条件可以使用：
- 模糊搜索：针对日志内容进行模糊搜索。
- 日志等级：筛选“info”和“error”等级。
- 时间范围：截取某一时间段的数据，包含分钟，开始时间自动填充00秒，结束时间自动填充59秒。


### 配置
进入配置页面，点击“新建配置”按钮，添加日志的数据源。

字段说明：
- 日志名称：用于给日志命名，方便区分不同的日志。
- 日志目录：日志文件的绝对路径。
- 日志文件名：日志文件的名称，包含文件后缀。

添加成功后，可在首页列表上方看到此日志名称。