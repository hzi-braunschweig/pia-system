import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
export declare class SnakeNamingStrategyWithPlural extends SnakeNamingStrategy {
    tableName(className: string, customName: string): string;
}
