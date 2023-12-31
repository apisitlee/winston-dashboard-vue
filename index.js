import WinstonDashboardServer from "./output/server/esm/index.mjs";

/**
 * 开启WinstonDashboardVue服务
 * @param {{port?: number}} config 配置项，port：服务监听端口（默认6688）
 */
export function WinstonDashboardVue(config) {
    WinstonDashboardServer(config || {});
}