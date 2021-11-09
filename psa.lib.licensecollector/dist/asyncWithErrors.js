"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncPassErrors = void 0;
const asyncPassErrors = (command) => {
    return async (root, options) => {
        try {
            await command(root, options);
        }
        catch (e) {
            console.error(e);
            process.exit(1);
        }
    };
};
exports.asyncPassErrors = asyncPassErrors;
//# sourceMappingURL=asyncWithErrors.js.map