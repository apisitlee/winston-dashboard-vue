import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);

function streamReadFiles(config: any) {
    const { logFilename, logPath } = config || {};
    const regex = new RegExp(logFilename);
    const fileContents: string[] = [];
    return readdir(logPath)
        .then((fileList) => {
            const fileReadPromises = fileList.map((filename) => {
                return new Promise((resolve, reject) => {
                    if (regex.test(filename)) {
                        const filePath = path.join(logPath, filename);
                        const stream = fs.createReadStream(filePath, 'utf8');
                        let content = '';

                        stream.on('data', (chunk) => {
                            content += chunk;
                        });

                        stream.on('end', () => {
                            fileContents.push(content);
                            resolve(true);
                        });

                        stream.on('error', (error) => {
                            reject(error);
                        });
                    } else {
                        resolve(false);
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

export async function fileFinder(readStorage: (filename: string) => string, onUpdate: any): Promise<any> {
    async function find(): Promise<any[]> {
        const list: any[] = [];
        // 读取../storage.local/active文件
        const active = readStorage('active.txt');
        if (active === '') return list;
        // 读取../storage.local/logs文件，获取所有日志源，筛选出当前日志源
        const configs = readStorage('logs.txt');
        const config = configs.split('\n').map((item) => JSON.parse(item)).filter((item) => item.id === active).pop() || {};
        try {
            const file = (await streamReadFiles(config)) || '';
            file.split('\n').map((item, index) => {
                if (!item) return;
                try {
                    const json: any = JSON.parse(item);
                    list.unshift(json);
                } catch (e) {
                    console.log('json parse error', e);
                    console.log('json parse error', item);
                    list.unshift({ item });
                }
            });
            return list;
        } catch (e) {
            console.log('stream read file error', e);
            return list;
        }
    }
    onUpdate(await find());
    setInterval(async () => {
        onUpdate(await find());
    }, 60 * 1000);

    async function flush() {
        onUpdate(await find());
    }

    return {
        flush
    }
}