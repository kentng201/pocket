
export type APIInfo = {
    url: string;
    token?: string;
};

export type APIResourceInfo = APIInfo & {
    resource: string;

    apiAutoCreate?: boolean;
    apiAutoUpdate?: boolean;
    apiAutoDelete?: boolean;
    apiFallbackGet?: boolean;
};

export type APIHosts = {
    [name: string]: APIInfo;
};

export class ApiHostManager {
    private static apiHosts: APIHosts = {};

    /**
     * setup API Host main path, default is empty string
     * @param url use for connect backend API server, end without dash "/"
     * example: http://localhost:3000
     * @param name use for switch API Host
     */
    static addHost(url: string, name: string = 'default') {
        this.apiHosts[name] = {url};
    }

    static getApiInfo(name: string = 'default') {
        if (this.apiHosts[name]) {
            return this.apiHosts[name];
        }
        throw new Error(`API Host "${name}" not found`);
    }

    static setToken(token: string, name: string = 'default') {
        if (this.apiHosts[name]) {
            this.apiHosts[name].token = token;
        }
        throw new Error(`API Host "${name}" not found`);
    }
}