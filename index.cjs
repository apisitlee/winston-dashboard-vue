const { WinstonDashboardServer } = require("./output/server/cjs/index.js");

/**
 * 开启WinstonDashboardVue服务
 * @param {{port?: number}} config 配置项，port：服务监听端口（默认6688）
 */
function WinstonDashboardVue(config) {
    WinstonDashboardServer(config || {});
}

module.exports.WinstonDashboardVue = WinstonDashboardVue