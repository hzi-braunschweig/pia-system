"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnakeNamingStrategyWithPlural = void 0;
const typeorm_naming_strategies_1 = require("typeorm-naming-strategies");
class SnakeNamingStrategyWithPlural extends typeorm_naming_strategies_1.SnakeNamingStrategy {
    tableName(className, customName) {
        const snakeName = super.tableName(className, customName);
        if (customName) {
            return snakeName;
        }
        else if (snakeName.endsWith('y')) {
            return snakeName.substring(0, snakeName.length - 1) + 'ies';
        }
        else if (snakeName.endsWith('s')) {
            return snakeName + 'es';
        }
        else
            return snakeName + 's';
    }
}
exports.SnakeNamingStrategyWithPlural = SnakeNamingStrategyWithPlural;
//# sourceMappingURL=snakeNamingStrategyWithPlural.js.map