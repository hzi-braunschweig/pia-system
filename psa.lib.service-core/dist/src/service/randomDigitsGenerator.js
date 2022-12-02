"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomDigitsGenerator = void 0;
const crypto_1 = require("crypto");
class RandomDigitsGenerator {
    static createInvertedArrayFromNumber(digits) {
        return digits.toString().split('').map(Number).reverse();
    }
    static generateChecksum(digits) {
        let c = 0;
        const invertedArray = this.createInvertedArrayFromNumber(digits);
        for (let i = 0; i < invertedArray.length; i++) {
            c = this.d[c][this.p[(i + 1) % 8][invertedArray[i]]];
        }
        return this.inv[c];
    }
    static validateChecksum(digits) {
        let c = 0;
        const invertedArray = this.createInvertedArrayFromNumber(digits);
        for (let i = 0; i < invertedArray.length; i++) {
            c = this.d[c][this.p[i % 8][invertedArray[i]]];
        }
        return c === 0;
    }
    static generate(length) {
        const minLength = 2;
        if (length < minLength) {
            throw new Error(`Must pass in minimum ${minLength} but provided ${length}`);
        }
        const digits = Array.from({ length: length - 1 }, () => (0, crypto_1.randomInt)(0, 9)).join('');
        const checksum = this.generateChecksum(digits);
        return `${digits}${checksum}`;
    }
}
exports.RandomDigitsGenerator = RandomDigitsGenerator;
RandomDigitsGenerator.d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
RandomDigitsGenerator.p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
RandomDigitsGenerator.inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];
//# sourceMappingURL=randomDigitsGenerator.js.map