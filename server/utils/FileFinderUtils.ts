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

export async function fileFinderGlobal(storage: any, onUpdate: any): Promise<any> {
    const listMap: Record<string, any[]> = {};
    const configList: any[] = storage.readStorageByLine('logs.txt').map((item: string) => JSON.parse(item));

    async function find(config: any): Promise<void> {
        const list: any[] = [];
        try {
            const file = (await streamReadFiles(config)) || '';
            file.split('\n').map((item) => {
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
            listMap[config.id] = list;
        } catch (e) {
            console.log('stream read file error', e);
            listMap[config.id] = list;
        }
    }
    async function loop() {
        for (let config of configList) {
            const task = async function () {
                try {
                    if (!(config.id in listMap)) {
                        listMap[config.id] = []
                    }
                    await find(config);
                } catch (e) {
                    console.log('stream read file error', e);
                }
            }
            await task();
            onUpdate(config.id, listMap[config.id])
        }
    }
    async function flush() {
        await loop();
    }
    function removeById(id: string) {
        if (id in listMap) {
            delete listMap[id];
        }
    }

    setInterval(async () => {
        await flush();
    }, 60 * 1000);

    return {
        flush,
        removeById,
    }
}