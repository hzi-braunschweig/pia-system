"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServerClient = void 0;
const keycloak_admin_client_1 = __importDefault(require("@keycloak/keycloak-admin-client"));
const util_1 = require("util");
const events_1 = require("events");
const ts_essentials_1 = require("ts-essentials");
const http_status_codes_1 = require("http-status-codes");
const MILLI_PER_SECOND = 1000;
const FIFE_SECONDS = 5;
class AuthServerClient extends keycloak_admin_client_1.default {
    constructor(clientSettings, reconnectInterval = MILLI_PER_SECOND) {
        super({
            baseUrl: clientSettings.connection.url,
            realmName: clientSettings.realm,
        });
        this.clientSettings = clientSettings;
        this.reconnectInterval = reconnectInterval;
        this.connectionEvents = new events_1.EventEmitter();
        this.waitForConnection = undefined;
        this.accessTokenLifespan = FIFE_SECONDS * MILLI_PER_SECOND;
        this.realm = clientSettings.realm;
    }
    connect() {
        if (!this.waitForConnection) {
            this.waitForConnection = (0, events_1.once)(this.connectionEvents, 'connected');
            this.initConnectionHandling();
            this.authenticate()
                .then(() => {
                this.connectionEvents.emit('connected');
            })
                .catch((e) => {
                if (e instanceof Error) {
                    console.error('first attempt to connect to keycloak failed with this reason:', e.message);
                }
                this.connectionEvents.emit('connection_lost');
            });
        }
    }
    disconnect() {
        this.connectionEvents.removeAllListeners();
        this.waitForConnection = undefined;
        this.resetInterval();
    }
    async waitForServer() {
        this.connect();
        await this.waitForConnection;
        await this.waitForRealm();
    }
    async authenticate() {
        await this.auth({
            grantType: 'client_credentials',
            clientId: this.clientSettings.clientId,
            clientSecret: this.clientSettings.secret,
        });
        const tokenPart = this.accessToken?.split('.')[1];
        let tokenLifespanInSeconds = 0;
        if (tokenPart) {
            const tokenPayload = JSON.parse(Buffer.from(tokenPart, 'base64').toString());
            if (typeof tokenPayload['exp'] === 'number' &&
                typeof tokenPayload['iat'] === 'number') {
                tokenLifespanInSeconds =
                    tokenPayload['exp'] - tokenPayload['iat'] - FIFE_SECONDS;
            }
        }
        if (tokenLifespanInSeconds < FIFE_SECONDS) {
            this.accessTokenLifespan = FIFE_SECONDS * MILLI_PER_SECOND;
            console.warn('Token lifespan is very short or exp and iat is missing in token. Refresh is set to 5 seconds.');
        }
        else {
            this.accessTokenLifespan = tokenLifespanInSeconds * MILLI_PER_SECOND;
        }
    }
    resetInterval() {
        if (this.currentInterval) {
            clearInterval(this.currentInterval);
        }
        this.currentInterval = undefined;
    }
    initConnectionHandling() {
        this.connectionEvents.on('connection_lost', () => {
            console.warn('lost connection to keycloak');
            try {
                this.reconnect();
            }
            catch (e) {
                console.error(e);
            }
        });
        this.connectionEvents.on('connected', () => {
            console.info('connected to keycloak');
            try {
                this.initRenewTokenHandling();
            }
            catch (e) {
                console.error(e);
            }
        });
    }
    reconnect() {
        (0, ts_essentials_1.assert)(this.currentInterval === undefined);
        this.waitForConnection = (0, events_1.once)(this.connectionEvents, 'connected');
        this.currentInterval = setInterval(() => {
            this.authenticate()
                .then(() => {
                this.resetInterval();
                this.connectionEvents.emit('connected');
            })
                .catch(() => {
                console.warn('waiting for keycloak to be started...');
            });
        }, this.reconnectInterval);
    }
    initRenewTokenHandling() {
        (0, ts_essentials_1.assert)(this.currentInterval === undefined);
        this.currentInterval = setInterval(() => {
            this.authenticate().catch(() => {
                this.resetInterval();
                this.connectionEvents.emit('connection_lost');
            });
        }, this.accessTokenLifespan);
    }
    async waitForRealm() {
        const sleep = (0, util_1.promisify)(setTimeout);
        for (;;) {
            try {
                await this.realms.findOne({
                    realm: this.clientSettings.realm,
                });
                break;
            }
            catch (e) {
                console.warn(`waiting for keycloak realm creation to be finished...`);
                if (e.response?.status ===
                    http_status_codes_1.StatusCodes.FORBIDDEN) {
                    await this.authenticate();
                }
                else {
                    console.error(e);
                }
                await sleep(this.reconnectInterval);
            }
        }
    }
}
exports.AuthServerClient = AuthServerClient;
//# sourceMappingURL=authServerClient.js.map