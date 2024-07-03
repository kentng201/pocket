class ApiHostManager {
    /**
     * setup API Host main path, default is empty string
     * @param url use for connect backend API server, end without dash "/"
     * example: http://localhost:3000
     * @param name use for switch API Host
     */
    static addHost(url, name = 'default') {
        // remove trailing dash "/"
        url = url.replace(/\/$/, '');
        this.apiHosts[name] = { url, };
    }
    static getApiInfo(name = 'default') {
        if (this.apiHosts[name]) {
            return this.apiHosts[name];
        }
        throw new Error(`API Host "${name}" not found`);
    }
    static setToken(token, name = 'default') {
        if (this.apiHosts[name]) {
            this.apiHosts[name].token = token;
            return;
        }
        throw new Error(`API Host "${name}" not found`);
    }
}
ApiHostManager.apiHosts = {};
export { ApiHostManager };
//# sourceMappingURL=ApiHostManager.js.map