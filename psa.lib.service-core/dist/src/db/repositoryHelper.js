"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryHelper = void 0;
class RepositoryHelper {
    static createDbConnectionGetter(db) {
        return (options) => {
            if (options?.transaction) {
                return options.transaction;
            }
            else {
                return db;
            }
        };
    }
}
exports.RepositoryHelper = RepositoryHelper;
//# sourceMappingURL=repositoryHelper.js.map