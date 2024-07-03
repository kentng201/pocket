import { ModelType, NewModelType } from '../definitions/Model';
import { BaseModel } from '../model/Model';
import { APIResourceInfo } from '../manager/ApiHostManager';
export type APIMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export declare class ApiRepo<T extends BaseModel> {
    protected apiInfo: APIResourceInfo;
    constructor(apiInfo: APIResourceInfo);
    get(id: string): Promise<T | undefined>;
    create(attributes: NewModelType<T>): Promise<T>;
    update(attributes: Partial<ModelType<T>>): Promise<T>;
    delete(id: string): Promise<any>;
    softDelete(id: string): Promise<any>;
    callApi(method: APIMethod, apiPath: string, params?: any): Promise<any>;
    callModelApi(method: APIMethod, apiPath: string, model?: Partial<ModelType<T>>): Promise<any>;
}
