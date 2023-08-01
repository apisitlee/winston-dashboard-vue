export const LogicUtils = {
    and(...parts: boolean[]) {
        return parts.reduce((prev, curr) => prev && curr, true);
    },
    or(...parts: boolean[]) {
        return parts.reduce((prev, curr) => prev || curr, false);
    },
    assert(source: any, target: any, relation: string) {
        let pass = false;
        if (typeof source !== 'string') {
            source = JSON.stringify(source);
        }
        if (typeof target !== 'string') {
            target = JSON.stringify(target);
        }
        switch (relation) {
            case 'eq': // 等于
                pass = source === target;
                break;
            case 'neq': // 不等于
                pass = source !== target;
                break;
            case 'c': // 包含
                try {
                    pass = source.includes(target);
                } catch (e: any) {
                    // console.log(e);
                }
                break;
            case 'nc': // 不包含
                try {
                    pass = !source.includes(target);
                } catch (e: any) {
                    // console.log(e);
                }
                break;
            case 'n': // 为空
                pass = source === '' || source === null || source === undefined;
                break;
            case 'nn': // 不为空
                pass = source !== '' && source !== null && source !== undefined;
                break;
            case 'lt': // 晚于
                try {
                    pass = new Date(source).getTime() - new Date(target).getTime() > 0;
                } catch (e: any) {
                    // console.log(e);
                }
                break;
            case 'pt': // 早于
                try {
                    pass = new Date(source).getTime() - new Date(target).getTime() < 0;
                } catch (e: any) {
                    // console.log(e);
                }
                break;
            default:
                break;
        }
        return pass;
    }
}