import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
// const createReadStream = promisify(fs.createReadStream);

function streamReadFile(config) {
    return new Promise((resolve, reject) => {
        const { logFilename, logPath } = config || {};
        let chunks = '';
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
            // return resolve(chunk);
            chunks += chunk;
        });
        stream.on('end', () => {
            console.log('stream read file end.');
            resolve(chunks);
        });
        stream.on('error', (err) => {
            console.log(err);
            reject(err);
        });
    });
}

function streamReadFiles(config) {
    const { logFilename, logPath } = config || {};
    const regex = new RegExp(logFilename);
    const fileContents = [];
    return readdir(logPath)
        .then((fileList) => {
            const fileReadPromises = fileList.map((filename) => {
                return new Promise((resolve, reject) => {
                    if (regex.test(filename)) {
                        console.log('符合：', filename);
                        const filePath = path.join(logPath, filename);
                        const stream = fs.createReadStream(filePath, 'utf8');
                        let content = '';

                        stream.on('data', (chunk) => {
                            content += chunk;
                        });

                        stream.on('end', () => {
                            console.log('读完了', filename);
                            fileContents.push(content);
                            resolve();
                        });

                        stream.on('error', (error) => {
                            reject(error);
                        });
                    } else {
                        console.log('不符合', filename);
                        resolve();
                    }
                });
            });

            return Promise.all(fileReadPromises);
        })
        .then(() => fileContents.join('\n'))
        .catch(res => {
            console.log('读取文件报错:', res);
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
        try {
            const file = await streamReadFiles(config);
            file.split('\n').map((item, index) => {
                if (!item) return;
                try {
                    const json = JSON.parse(item);
                    list.unshift(json);
                } catch (e) {
                    console.log('json parse error', e);
                    console.log('json parse error', item);
                    list.unshift({ item });
                }
            });
            return list;
        } catch(e) {
            console.log('stream read file error', e);
            return list;
        }
    }
    onUpdate(await find());
    setInterval(async () => {
        onUpdate(await find());
    }, 60 * 1000);

    async function flush() {
        console.log('flush');
        onUpdate(await find());
    }

    return {
        flush
    }
}