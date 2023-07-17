import fs from 'fs';
import path from 'path';

export default function setupStorage() {
    const storageDir = path.resolve(process.cwd(), 'server/storage.local');
    const dirExists = fs.existsSync(storageDir);
    if (!dirExists) {
        fs.mkdirSync(storageDir);
    }

    const activePath = path.resolve(process.cwd(), 'server/storage.local/active.txt');
    const activeExists = fs.existsSync(activePath);
    if (!activeExists) {
        fs.writeFileSync(activePath, '');
    }

    const logsPath = path.resolve(process.cwd(), 'server/storage.local/logs.txt');
    const logsExists = fs.existsSync(logsPath);
    if (!logsExists) {
        fs.writeFileSync(logsPath, '');
    }
}