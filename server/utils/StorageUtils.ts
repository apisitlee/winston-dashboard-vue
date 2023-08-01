import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';

type Config = {
    storageDir?: string
}
type Res = {
    readStorage: (filename: string) => string
    readStorageByLine: (filename: string) => string[]
    writeStorage: (filename: string, content: string) => void
    appendStorage: (filename: string, content: string) => void
}

export default function setupStorage(config: Config): Res {
    const { storageDir = 'storage.local' } = config || {}
    const dirExists = fs.existsSync(storageDir);
    if (!dirExists) {
        fs.mkdirSync(storageDir);
    }

    const activePath = path.resolve(storageDir, 'active.txt');
    const activeExists = fs.existsSync(activePath);
    if (!activeExists) {
        fs.writeFileSync(activePath, '');
    }

    const logsPath = path.resolve(storageDir, 'logs.txt');
    const logsExists = fs.existsSync(logsPath);
    if (!logsExists) {
        fs.writeFileSync(logsPath, '');
    }


    // 将1.0.13之前的配置格式转换成1.0.14之后的格式
    const logConfigList = readStorageByLine('logs.txt');
    let isOld = false;
    try {
        JSON.parse(logConfigList[0])
    } catch (e) {
        isOld = true;
    }
    if (isOld) {
        const activeTimestamp = readStorage('active.txt');
        let activeId = '';
        logConfigList.map((str) => {
            const [timestamp, name, logPath, logFilename, tagStr] = str.split('\t');
            const id = uuid();
            if (timestamp === activeTimestamp) {
                activeId = id;
            }
            return {
                id,
                timestamp,
                name,
                logPath,
                logFilename,
                tags: JSON.parse(tagStr || '[]'),
                customColumns: []
            }
        });
        const content = logConfigList.map((item) => JSON.stringify(item)).join('\n');
        writeStorage('logs.txt', content + '\n');
        if (activeId) {
            writeStorage('active.txt', activeId);
        }
    }


    function readStorage(filename: string) {
        return fs.readFileSync(path.resolve(storageDir, filename), {
            encoding: 'utf8',
        }).trim()
    }
    function readStorageByLine(filename: string) {
        const content = fs.readFileSync(path.resolve(storageDir, filename), {
            encoding: 'utf8',
        }).trim()
        return content ? content.split('\n').filter(p => !!p) : []
    }
    function writeStorage(filename: string, content: string) {
        fs.writeFileSync(path.resolve(storageDir, filename), content);
    }
    function appendStorage(filename: string, content: string) {
        fs.appendFileSync(path.resolve(storageDir, filename), content);
    }
    return {
        readStorage,
        readStorageByLine,
        writeStorage,
        appendStorage,
    };
}