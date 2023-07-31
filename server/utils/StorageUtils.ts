import fs from 'fs';
import path from 'path';

export default function setupStorage({ storageDir }) {
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

    return {
        readStorage(filename: string) {
            return fs.readFileSync(path.resolve(storageDir, filename), {
                encoding: 'utf8',
            }).trim()
        },
        writeStorage(filename: string, content: string) {
            fs.writeFileSync(path.resolve(storageDir, filename), content);
        },
        appendStorage(filename: string, content: string) {
            fs.appendFileSync(path.resolve(storageDir, filename), content);
        }
    };
}