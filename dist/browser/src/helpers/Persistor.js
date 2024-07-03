const isBrowser = typeof window !== 'undefined';
function set(key, value) {
    if (!isBrowser)
        return;
    if (typeof value === 'object') {
        window.localStorage.setItem(key, JSON.stringify(value));
    }
    else if (typeof value === 'string') {
        window.localStorage.setItem(key, value);
    }
    else if (typeof value === 'number') {
        window.localStorage.setItem(key, value);
    }
}
function clear(key) {
    if (!isBrowser)
        return;
    window.localStorage.removeItem(key);
}
function get(key) {
    if (!isBrowser)
        return;
    const item = window.localStorage.getItem(key);
    if (!item)
        return undefined;
    const objectRegex = /^\{.*\}$/;
    if (objectRegex.test(item)) {
        return JSON.parse(item);
    }
    return item;
}
export class Persistor {
    static set(value) {
        set(this.name, value);
    }
    static clear() {
        clear(this.name);
    }
    static get() {
        return get(this.name);
    }
}
//# sourceMappingURL=Persistor.js.map