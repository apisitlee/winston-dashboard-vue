import fs from 'fs';
import path from 'path';

function streamReadFile(config) {
    return new Promise((resolve, reject) => {
        const { logFilename, logPath } = config || {};
        if (!logFilename || !logPath) {
            return resolve('');
        }
        const logFilePath = `${logPath}/${logFilename}`;
        if (!fs.existsSync(logFilePath)) {
            return resolve('');
        }
        // stream read file
        const stream = fs.createReadStream(logFilePath, {
            encoding: 'utf8',
        });
        stream.on('data', (chunk) => {
            return resolve(chunk);
        });
        stream.on('end', () => {
            console.log('stream read file end.');
        });
        stream.on('error', (err) => {
            console.log(err);
            reject(err);
        });
    });
}

export async function fileFinder(onUpdate) {
    if (!onUpdate && !(onUpdate instanceof Function)) return;
    async function find() {
        const list = [];
        // 读取../storage.local/active文件
        const active = fs.readFileSync(path.resolve(process.cwd(), 'server/storage.local/active.txt'), {
            encoding: 'utf8',
        }).trim();
        if (active === '') return list;
        // 读取../storage.local/logs文件，获取所有日志源，筛选出当前日志源
        const configs = fs.readFileSync(path.resolve(process.cwd(), 'server/storage.local/logs.txt'), {
            encoding: 'utf8',
        }).trim();
        const config = configs.split('\n').map((item) => {
            const [timestamp, name, logPath, logFilename] = item.split('\t');
            return {
                timestamp,
                name,
                logPath,
                logFilename,
            };
        }).filter((item) => {
            return item.timestamp === active;
        }).pop() || {};
        const file = await streamReadFile(config);
        file.split('\n').map((item, index) => {
            if (!item) return;
            try {
                const json = JSON.parse(item);
                list.unshift(json);
            } catch (e) {
                console.log('json parse error', e);
                console.log('json parse error', item);
            }
        });
        return list;
    }
    onUpdate(await find());
    setInterval(async () => {
        onUpdate(await find());
    }, 60 * 1000);
}