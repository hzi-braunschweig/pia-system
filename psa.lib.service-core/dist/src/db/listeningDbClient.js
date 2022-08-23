"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListeningDbClient = void 0;
const util_1 = __importDefault(require("util"));
const events_1 = __importDefault(require("events"));
const sleep = util_1.default.promisify(setTimeout);
class ListeningDbClient extends events_1.default {
    constructor(db) {
        super();
        this.db = db;
        this.sco = null;
        this.disconnected = false;
        this.TIME_TO_WAIT_BEFORE_RETRY = 1000;
    }
    static onError(err) {
        console.error('Unexpected error on listening client.', err);
    }
    async connect() {
        this.disconnected = false;
        while (!this.sco && !this.disconnected) {
            try {
                this.sco = await this.db.connect({
                    onLost: (err) => void this.onConnectionLost(err),
                });
            }
            catch (err) {
                console.error('Could not connect to DB. I will try again in a second.', err);
                await sleep(this.TIME_TO_WAIT_BEFORE_RETRY);
            }
        }
        if (!this.disconnected && this.sco) {
            this.sco.client.on('error', (err) => ListeningDbClient.onError(err));
            console.log('Connected to DB');
            this.emit('connected', this.sco.client);
        }
    }
    async disconnect() {
        this.disconnected = true;
        if (this.sco) {
            await this.sco.done();
            this.sco.client.removeAllListeners();
            this.sco = null;
        }
        else {
            console.warn('Could not disconnect as no DB client exists');
        }
    }
    async onConnectionLost(err) {
        console.error('Connection lost on listening client.', err);
        await this.disconnect();
        console.error('reconnecting...');
        await this.connect();
    }
}
exports.ListeningDbClient = ListeningDbClient;
//# sourceMappingURL=listeningDbClient.js.map