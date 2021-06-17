"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransactionRunner = void 0;
function createTransactionRunner(db) {
    return async (callback) => {
        return db.tx(async (transaction) => callback(transaction));
    };
}
exports.createTransactionRunner = createTransactionRunner;
//# sourceMappingURL=transactionRunnerFactory.js.map