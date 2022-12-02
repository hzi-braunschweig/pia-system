export declare class RandomDigitsGenerator {
    private static readonly d;
    private static readonly p;
    private static readonly inv;
    static createInvertedArrayFromNumber(digits: number | string): number[];
    static generateChecksum(digits: number | string): number;
    static validateChecksum(digits: number | string): boolean;
    static generate(length: number): string;
}
