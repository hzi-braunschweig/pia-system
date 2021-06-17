"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerRunner = void 0;
class ServerRunner {
    constructor(server) {
        this.server = server;
    }
    start() {
        this.init().catch((err) => {
            console.error('Could not start the server:', err);
            process.exit(1);
        });
        const stop = () => {
            process.removeListener('SIGINT', stop);
            process.removeListener('SIGTERM', stop);
            console.log('SIGINT/SIGTERM received -> cleaning up...');
            this.stop().catch((err) => {
                console.error('Could not stop the server gracefully:', err);
                process.exit(1);
            });
        };
        process.addListener('SIGINT', stop);
        process.addListener('SIGTERM', stop);
    }
    async init() {
        await this.server.init();
        console.info('Server started');
    }
    async stop() {
        await this.server.stop();
        console.info('Server stopped');
        if (this.server.terminate) {
            await this.server.terminate();
            console.info('terminate completed');
        }
    }
}
exports.ServerRunner = ServerRunner;
//# sourceMappingURL=serverRunner.js.map