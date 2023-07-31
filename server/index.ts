import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import { fileFinder } from './utils/FileFinderUtils.js';
import path from 'path';
import setupStorage from './utils/StorageUtils.js';
import type { WinstonDashboardServerConfig } from './index.d.js';

export async function WinstonDashboardServer(config: WinstonDashboardServerConfig = {}) {

    const port = config.port || 6688;

    const app = new Koa();
    const router = new Router();

    // 本地存储
    const { readStorage, writeStorage, appendStorage } = setupStorage({
        storageDir: path.resolve(process.cwd(), config.storageDir || 'storage.local')
    });

    let list: any[] = [];
    const { flush } = await fileFinder(readStorage, (data: any[]) => {
        list = data;
    });

    // 使用static托管web页面
    console.log('服务cwd:', process.cwd());
    app.use(serve(process.cwd() + '/web/dist/'));

    // 使用bodyParser
    app.use(bodyParser());

    // 添加日志监控配置
    router.post('/api/logConfig/add', async (ctx: any) => {
        const { body } = ctx.request;
        const { logPath, logFilename, name, tags = [] } = body || {};
        const tagStr = JSON.stringify(Array.from(tags));
        if (!logPath || !logFilename || !name) {
            ctx.body = {
                code: 2,
                msg: '参数错误'
            };
            return;
        }
        try {
            // 创建一条记录，格式：timestamp\tname\tlogPath\tlogFilename
            const newRecord = `${new Date().getTime()}\t${name}\t${logPath}\t${logFilename}\t${tagStr}`;
            // 将记录添加在../storage.local/logs文件最后一行
            appendStorage('logs.txt', newRecord + '\n');
            ctx.body = {
                code: 0,
                msg: '添加成功'
            };
        } catch (e) {
            ctx.body = {
                code: 1,
                msg: '添加失败：\n' + JSON.stringify({error: e})
            };
            return;
        }
    });

    // 根据timestamp删除日志监控配置中的一条
    router.delete('/api/logConfig/delete', async (ctx: any) => {
        const { body } = ctx.request;
        const { timestamp } = body || {};
        if (!timestamp) {
            ctx.body = {
                code: 2,
                msg: '参数错误'
            };
            return;
        }
        try {
            // 读取../storage.local/logs文件，获取所有日志源
            let listStr = readStorage('logs.txt');
            let list = listStr.length ? listStr.split('\n').map((item) => {
                const [timestamp, name, logPath, logFilename, tagStr] = item.split('\t');
                return {
                    timestamp,
                    name,
                    logPath,
                    logFilename,
                    tagStr,
                };
            }) : [];
            list = list.filter((row) => {
                return row.timestamp !== timestamp;
            });
            listStr = list.map((row) => `${row.timestamp}\t${row.name}\t${row.logPath}\t${row.logFilename}\t${row.tagStr}`).join('\n');
            // 覆写
            writeStorage('logs.txt', listStr + '\n');
            ctx.body = {
                code: 0,
                msg: '删除成功'
            };
        } catch(e) {
            ctx.body = {
                code: 1,
                msg: '删除失败：\n' + JSON.stringify({error: e})
            };
            return;
        }
    });

    // 修改日志监控配置
    router.post('/api/logConfig/update', async (ctx: any) => {
        const { body } = ctx.request;
        const { timestamp, logPath, logFilename, name, tags = [] } = body || {};
        const tagStr = JSON.stringify(Array.from(tags));
        if (!timestamp || !logPath || !logFilename || !name) {
            ctx.body = {
                code: 2,
                msg: '参数错误'
            };
            return;
        }
        try {
            // 读取../storage.local/logs文件，获取所有日志源
            let listStr = readStorage('logs.txt');
            let list = listStr.length ? listStr.split('\n').map((item) => {
                const [timestamp, name, logPath, logFilename, tagStr] = item.split('\t');
                return {
                    timestamp,
                    name,
                    logPath,
                    logFilename,
                    tagStr,
                };
            }) : [];
            list = list.map((row) => {
                if (row.timestamp === timestamp) {
                    return {
                        timestamp,
                        name,
                        logPath,
                        logFilename,
                        tagStr,
                    };
                }
                return row;
            });
            listStr = list.map((row) => `${row.timestamp}\t${row.name}\t${row.logPath}\t${row.logFilename}\t${row.tagStr}`).join('\n');
            // 覆写
            writeStorage('logs.txt', listStr + '\n');
            ctx.body = {
                code: 0,
                msg: '修改成功'
            };
        } catch(e) {
            ctx.body = {
                code: 1,
                msg: '修改失败：\n' + JSON.stringify({error: e})
            };
            return;
        }
    });

    // 读取日志源列表
    router.get('/api/logConfig/list', async (ctx: any) => {
        try {
            // 读取../storage.local/logs文件，获取所有日志源
            const list = readStorage('logs.txt');
            ctx.body = {
                code: 0,
                msg: 'success',
                data: list.length ? list.split('\n').map((item) => {
                    const [timestamp, name, logPath, logFilename, tagStr = '[]'] = item.split('\t');
                    return {
                        timestamp,
                        name,
                        logPath,
                        logFilename,
                        tags: JSON.parse(tagStr || '[]')
                    };
                }) : [],
            };
        } catch (e) {
            ctx.body = {
                code: 1,
                msg: '读取失败：\n' + JSON.stringify({error: e})
            };
            return;
        }
    });

    // 设置监控日志源
    router.post('/api/logConfig/active', async (ctx: any) => {
        const { body } = ctx.request;
        const { timestamp } = body || {};
        if (!timestamp) {
            ctx.body = {
                code: 2,
                msg: '参数错误'
            };
            return;
        }
        try {
            // 将timestamp写入../storage.local/active文件
            writeStorage('active.txt', timestamp);
            ctx.body = {
                code: 0,
                msg: '设置成功'
            };
            flush();
        } catch (e) {
            console.log(e);
            ctx.body = {
                code: 1,
                msg: '设置失败：\n' + JSON.stringify({error: e})
            };
            return;
        }
    });

    // 查询active日志源
    router.get('/api/logConfig/active', async (ctx: any) => {
        try {
            // 读取../storage.local/active文件
            const timestamp = readStorage('active.txt');
            ctx.body = {
                code: 0,
                msg: '成功',
                data: timestamp,
            };
        } catch (e) {
            ctx.body = {
                code: 1,
                msg: '获取失败：\n' + JSON.stringify({error: e})
            };
            return;
        }
    });

    // 查询日志
    router.get('/api/query', async (ctx: any) => {
        const { query } = ctx.request;
        let { level, s, pageNo = 1, pageSize = 10, range = '' } = query || {};
        pageNo = parseInt(pageNo);
        pageSize = parseInt(pageSize);
        let [startTime, endTime] = range.split(',');
        const result = list.filter(item => {
            if (level && item.level !== level) return false;
            if (s) {
                if (typeof item.message === 'string' && !(item.message).includes(s)) return false;
                if (!JSON.stringify(item.message).includes(s)) return false;
            }
            if (startTime && endTime) {
                const time = new Date(item.timestamp);
                if (time < new Date(startTime) || time > new Date(endTime)) return false;
            }
            return true;
        });
        const total = result.length;
        const start = (pageNo - 1) * pageSize;
        const end = pageNo * pageSize;
        const data = result.slice(start, end);
        const pageCount = Math.ceil(total / pageSize);
        const hasNext = pageNo < pageCount;
        const hasPrev = pageNo > 1;
        ctx.body = {
            code: 0,
            msg: 'success',
            data: {
                total,
                list: data,
                hasNext,
                hasPrev,
                pageNo,
                pageSize,
                pageCount
            }
        }
    });

    // 使用router
    app.use(router.routes()).use(router.allowedMethods());

    app.listen(port, () => {
        console.log(`WinstonDashboardVue is listening on http://localhost:${port}`);
    });
}