import { LogicUtils } from './utils/LogicUtils.js';
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import { fileFinderGlobal } from './utils/FileFinderUtils.js';
import path from 'path';
import setupStorage from './utils/StorageUtils.js';
import type { WinstonDashboardServerConfig } from './index.d.js';
import { v4 as uuid } from 'uuid';

export async function WinstonDashboardServer(config: WinstonDashboardServerConfig = {}) {

    const port = config.port || 6688;

    const app = new Koa();
    const router = new Router();

    // 本地存储
    const storage = setupStorage({
        storageDir: path.resolve(process.cwd(), config.storageDir || 'storage.local')
    });
    const { readStorage, readStorageByLine, writeStorage, appendStorage } = storage;

    let listMap: Record<string, any[]> = {};
    let list: any[] = [];
    const { flush, removeById: removeFileFinderCacheById } = await fileFinderGlobal(storage, ((id: string, data: any[]) => {
        if (!(id in listMap)) {
            listMap[id] = []
        }
        listMap[id] = data;
    }));

    // 使用static托管web页面
    app.use(serve(path.resolve(__dirname, '../../web/')));

    // 使用bodyParser
    app.use(bodyParser());

    // 添加日志监控配置
    router.post('/api/logConfig/add', async (ctx: any) => {
        const { body } = ctx.request;
        const { logPath, logFilename, name, tags = [], customColumns = [] } = body || {};
        if (!logPath || !logFilename || !name) {
            ctx.body = {
                code: 2,
                msg: '参数错误'
            };
            return;
        }
        try {
            // 创建一条新记录
            const newRecord = JSON.stringify({
                id: uuid(),
                timestamp: new Date().getTime(),
                name: name || '',
                logPath: logPath || '',
                logFilename: logFilename || '',
                tags: tags || [],
                customColumns: customColumns || []
            });
            // 将新记录添加在../storage.local/logs文件最后一行
            appendStorage('logs.txt', newRecord + '\n');
            ctx.body = {
                code: 0,
                msg: '添加成功'
            };
        } catch (e) {
            ctx.body = {
                code: 1,
                msg: '添加失败：\n' + JSON.stringify({ error: e })
            };
            return;
        }
    });

    // 根据timestamp删除日志监控配置中的一条
    router.delete('/api/logConfig/delete', async (ctx: any) => {
        const { body } = ctx.request;
        const { id } = body || {};
        if (!id) {
            ctx.body = {
                code: 2,
                msg: '参数错误'
            };
            return;
        }
        try {
            // 读取../storage.local/logs文件，获取所有日志源
            let list = readStorageByLine('logs.txt').map((item) => JSON.parse(item));
            list = list.filter((row) => row.id !== id);
            const content = list.map((item) => JSON.stringify(item)).join('\n');
            // 覆写
            writeStorage('logs.txt', content + '\n');
            // 删除该日志在内存中的缓存
            removeFileFinderCacheById(id);
            ctx.body = {
                code: 0,
                msg: '删除成功'
            };
        } catch (e) {
            ctx.body = {
                code: 1,
                msg: '删除失败：\n' + JSON.stringify({ error: e })
            };
            return;
        }
    });

    // 修改日志监控配置
    router.post('/api/logConfig/update', async (ctx: any) => {
        const { body } = ctx.request;
        const { id, timestamp, logPath, logFilename, name, tags = [], customColumns = [] } = body || {};
        if (!id || !timestamp || !logPath || !logFilename || !name) {
            ctx.body = {
                code: 2,
                msg: '参数错误'
            };
            return;
        }
        try {
            // 读取../storage.local/logs文件，获取所有日志源
            let list = readStorageByLine('logs.txt').map((item) => JSON.parse(item));
            list = list.map((row) => {
                if (row.id === id) {
                    return {
                        id,
                        timestamp,
                        name,
                        logPath,
                        logFilename,
                        tags,
                        customColumns,
                    };
                }
                return row;
            });
            const content = list.map((item) => JSON.stringify(item)).join('\n');
            // 覆写
            writeStorage('logs.txt', content + '\n');
            ctx.body = {
                code: 0,
                msg: '修改成功'
            };
        } catch (e) {
            ctx.body = {
                code: 1,
                msg: '修改失败：\n' + JSON.stringify({ error: e })
            };
            return;
        }
    });

    // 读取日志源列表
    router.get('/api/logConfig/list', async (ctx: any) => {
        try {
            // 读取../storage.local/logs文件，获取所有日志源
            const list = readStorageByLine('logs.txt').map((row) => JSON.parse(row));
            ctx.body = {
                code: 0,
                msg: 'success',
                data: list,
            };
        } catch (e) {
            ctx.body = {
                code: 1,
                msg: '读取失败：\n' + JSON.stringify({ error: e })
            };
            return;
        }
    });

    // 查询日志
    router.post('/api/query', async (ctx: any) => {
        try {
            const { body } = ctx.request;
            let { level, s, pageNo = 1, pageSize = 10, range = [], refresh = false, filters = [], filterRelation = '所有', id } = body || {};
            pageNo = parseInt(pageNo);
            pageSize = parseInt(pageSize);
            let [startTime, endTime] = range;
            if (refresh) {
                flush();
            }
            function getObjectValue(obj: object, key: string) {
                const keys = key.split('.') || [];
                let tmp: any = obj;
                let max = keys.length;
                let i = 0;
                for (let k of keys) {
                    let old: any = tmp;
                    tmp = old[k];
                    if (++i < max && typeof tmp !== 'object') {
                        tmp = old;
                        continue;
                    }
                }
                return tmp;
            }
            function getSourceValue(item: any, dataIndex: string, isCustom: boolean) {
                if (isCustom) {
                    return getObjectValue(item.message, dataIndex);
                } else {
                    return getObjectValue(item, dataIndex);
                }
            }
            let result = (listMap[id] || []).filter(item => {
                if (level && item.level !== level) return false;
                if (s) {
                    if (typeof item.message === 'string' && !(item.message).includes(s)) return false;
                    if (!JSON.stringify(item.message).includes(s)) return false;
                }
                if (startTime && endTime) {
                    const time = new Date(item.timestamp);
                    if (time < new Date(startTime) || time > new Date(endTime)) return false;
                }
                if (filters && filters.length) {
                    // dataIndex, relation, value, isCustom
                    const relate = filterRelation === '所有' ? LogicUtils.and : LogicUtils.or;
                    return relate(...filters.map((filter: any) => {
                        return LogicUtils.assert(getSourceValue(item, filter.dataIndex, filter.isCustom), filter.value, filter.relation)
                    }));
                }
                return true;
            });
            result = result.sort((a: any, b: any) => (new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
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
        } catch (e: any) {
            console.log(e);
            ctx.body = {
                code: 1,
                msg: 'Server Error',
                data: {},
                e: typeof e === 'object' ? JSON.stringify(e) : e,
            }
        }
    });

    // 使用router
    app.use(router.routes()).use(router.allowedMethods());

    app.listen(port, () => {
        console.log(`WinstonDashboardVue is listening on http://localhost:${port}`);
    });
}