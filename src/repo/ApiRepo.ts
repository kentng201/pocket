import axios from 'axios';
import { ModelKey, ModelType, NewModelType } from 'src/definitions/Model';
import { Model } from 'src/model/Model';
import { APIResourceInfo } from 'src/manager/ApiHostManager';

export type APIMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export class ApiRepo<T extends Model> {
    protected apiInfo: APIResourceInfo;

    constructor(apiInfo: APIResourceInfo) {
        this.apiInfo = apiInfo;
    }
    
    async get(_id: string): Promise<T | undefined> {
        const { resource, url, token } = this.apiInfo;
        const result = await axios.get(`${url}/${resource}/${_id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return {_id, ...result.data};
    }
    async create(attributes: NewModelType<T>): Promise<T> {
        const { resource, url, token } = this.apiInfo;
        const result = await axios.post(`${url}/${resource}/${attributes._id}`, attributes, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return result.data;
    }
    async update(attributes: Partial<ModelType<T>>): Promise<T> {
        const { resource, url, token } = this.apiInfo;
        const result = await axios.put(`${url}/${resource}/${attributes._id}`, attributes, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return result.data;
    }
    async delete(_id: string): Promise<T> {
        const { resource, url, token } = this.apiInfo;
        const result = await axios.delete(`${url}/${resource}/${_id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return result.data;
    }

    async callApi(method: APIMethod, apiPath: string, params?: any): Promise<any> {
        const { resource, url, token } = this.apiInfo;
        const result = await axios({
            method,
            url: `${url}/${resource}/api/${apiPath}`,
            data: params,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return result.data;
    }
    async callModelApi(method: APIMethod, apiPath: string, model?: Partial<ModelType<T>>): Promise<any> {
        const { resource, url, token } = this.apiInfo;
        const result = await axios({
            method,
            url: `${url}/${resource}/${model?._id}/${apiPath}`,
            data: model,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return result.data;
    }
}