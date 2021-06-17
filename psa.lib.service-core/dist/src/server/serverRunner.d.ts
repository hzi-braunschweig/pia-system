export interface Server {
    init(): Promise<void>;
    stop(): Promise<void>;
    terminate?(): Promise<void>;
}
export declare class ServerRunner {
    private readonly server;
    constructor(server: Server);
    start(): void;
    private init;
    private stop;
}
