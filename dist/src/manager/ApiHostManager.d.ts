export type APIInfo = {
    url: string;
    token?: string;
};
export type APIResourceInfo = APIInfo & {
    resource: string;
    apiAutoCreate?: boolean;
    apiAutoUpdate?: boolean;
    apiAutoDelete?: boolean;
    apiAutoSoftDelete?: boolean;
    apiFallbackGet?: boolean;
};
export type APIHosts = {
    [name: string]: APIInfo;
};
export declare class ApiHostManager {
    private static apiHosts;
    /**
     * setup API Host main path, default is empty string
     * @param url use for connect backend API server, end without dash "/"
     * example: http://localhost:3000
     * @param name use for switch API Host
     */
    static addHost(url: string, name?: string): void;
    static getApiInfo(name?: string): APIInfo;
    static setToken(token: string, name?: string): void;
}
