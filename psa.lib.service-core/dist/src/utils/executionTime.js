"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionTime = void 0;
const perf_hooks_1 = require("perf_hooks");
class ExecutionTime {
    constructor() {
        this.startTime = perf_hooks_1.performance.now();
    }
    get() {
        return perf_hooks_1.performance.now() - this.startTime;
    }
    toString() {
        return `(took ${Math.round(this.get())} ms)`;
    }
}
exports.ExecutionTime = ExecutionTime;
//# sourceMappingURL=executionTime.js.map