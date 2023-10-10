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
        return `(took ${Math.round(this.get() * ExecutionTime.ROUND_DIVIDER) /
            ExecutionTime.ROUND_DIVIDER} ms)`;
    }
}
exports.ExecutionTime = ExecutionTime;
ExecutionTime.ROUND_DIVIDER = 100;
//# sourceMappingURL=executionTime.js.map