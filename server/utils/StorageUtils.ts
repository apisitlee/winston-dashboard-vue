import fs from 'fs';
import path from 'path';

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

    const logsPath = path.resolve(storageDir, 'logs.txt');
    const logsExists = fs.existsSync(logsPath);
    if (!logsExists) {
        fs.writeFileSync(logsPath, '');
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