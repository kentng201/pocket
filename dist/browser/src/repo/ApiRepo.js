var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
export class ApiRepo {
    constructor(apiInfo) {
        this.apiInfo = apiInfo;
    }
    get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const { resource, url, token, } = this.apiInfo;
            const result = yield axios.get(`${url}/${resource}/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return result.data;
        });
    }
    create(attributes) {
        return __awaiter(this, void 0, void 0, function* () {
            const { resource, url, token, } = this.apiInfo;
            const result = yield axios.post(`${url}/${resource}/${attributes.id}`, attributes, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return result.data;
        });
    }
    update(attributes) {
        return __awaiter(this, void 0, void 0, function* () {
            const { resource, url, token, } = this.apiInfo;
            const result = yield axios.put(`${url}/${resource}/${attributes.id}`, attributes, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return result.data;
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const { resource, url, token, } = this.apiInfo;
            const result = yield axios.delete(`${url}/${resource}/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return result.data;
        });
    }
    softDelete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const { resource, url, token, } = this.apiInfo;
            const result = yield axios.delete(`${url}/${resource}/${id}/soft`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return result.data;
        });
    }
    callApi(method, apiPath, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { resource, url, token, } = this.apiInfo;
            const result = yield axios({
                method,
                url: `${url}/${resource}/api/${apiPath}`,
                data: params,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return result.data;
        });
    }
    callModelApi(method, apiPath, model) {
        return __awaiter(this, void 0, void 0, function* () {
            const { resource, url, token, } = this.apiInfo;
            const result = yield axios({
                method,
                url: `${url}/${resource}/${model === null || model === void 0 ? void 0 : model.id}/${apiPath}`,
                data: model,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return result.data;
        });
    }
}
//# sourceMappingURL=ApiRepo.js.map