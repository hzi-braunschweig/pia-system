"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
const fetch = __importStar(require("node-fetch"));
const boom_1 = __importDefault(require("@hapi/boom"));
const http_status_codes_1 = require("http-status-codes");
class HttpClient {
    constructor(serviceUrl) {
        this.serviceUrl = serviceUrl;
    }
    async get(url, options = {}) {
        return this.fetch('GET', url, options);
    }
    async post(url, body, options = {}) {
        return this.fetch('POST', url, options, body);
    }
    async put(url, body, options = {}) {
        return this.fetch('PUT', url, options, body);
    }
    async patch(url, body, options = {}) {
        return this.fetch('PATCH', url, options, body);
    }
    async delete(url) {
        return this.fetch('DELETE', url, {});
    }
    async fetch(method, url, additionalOptions, body) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        const options = {
            ...HttpClient.defaultRequestOptions,
            ...additionalOptions,
        };
        let res;
        try {
            if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
                res = await HttpClient.fetch(`${this.serviceUrl}${url}`, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers,
                    },
                    body: JSON.stringify(body),
                });
            }
            else {
                res = await HttpClient.fetch(`${this.serviceUrl}${url}`, {
                    method: method,
                    headers: options.headers,
                });
            }
        }
        catch (e) {
            throw boom_1.default.serverUnavailable(`${method} ${url} did not receive a response`, e);
        }
        if (!res.ok) {
            if (options.returnNullWhenNotFound &&
                res.status === http_status_codes_1.StatusCodes.NOT_FOUND) {
                return null;
            }
            throw boom_1.default.internal(`${method} ${url} received an Error`, await res.text(), res.status);
        }
        if (method === 'DELETE' || res.status === http_status_codes_1.StatusCodes.NO_CONTENT) {
            return;
        }
        if (options.responseType === 'text') {
            return res.text();
        }
        return res.json();
    }
}
exports.HttpClient = HttpClient;
HttpClient.fetch = fetch.default;
HttpClient.defaultRequestOptions = {
    responseType: 'json',
    returnNullWhenNotFound: false,
    headers: {},
};
//# sourceMappingURL=httpClient.js.map