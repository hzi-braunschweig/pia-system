// Multiplication table d
const d = [
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

// Permutation table p
const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

// Inverse table inv
const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Converts string or number to an array and inverts it
 *
 * @param array {number}
 */
function invArray(array) {
  if (Object.prototype.toString.call(array) == '[object Number]') {
    array = String(array);
  }

  if (Object.prototype.toString.call(array) == '[object String]') {
    array = array.split('').map(Number);
  }

  return array.reverse();
}

/**
 * Generates checksum according to Verhoeff algorithm
 *
 * @param array {number}
 */
function generateChecksum(array) {
  let c = 0;
  const invertedArray = invArray(array);

  for (let i = 0; i < invertedArray.length; i++) {
    c = d[c][p[(i + 1) % 8][invertedArray[i]]];
  }

  return inv[c];
}

/**
 * Validates checksum according to Verhoeff algorithm
 *
 * @param array {number}
 */
function validateChecksum(array) {
  let c = 0;
  const invertedArray = invArray(array);

  for (let i = 0; i < invertedArray.length; i++) {
    c = d[c][p[i % 8][invertedArray[i]]];
  }

  return c === 0;
}

/**
 * Generates a random pseudonym consisting of prefix, number of digits and separator (defaults to '-')
 *
 * Example: ("PIA", 8) would generate a pseudonmy similar to PIA-92445205
 *
 * @param prefix {string}
 * @param digits {number}
 * @param separator {string}
 * @return {string}
 */
function generateRandomPseudonym(prefix, digits, separator = '-') {
  const maxDigits = 16; // Including checksum
  const minDigits = 5; // Including checksum
  const finalDigits = digits + 1; // + 1 because of added checksum

  if (finalDigits > maxDigits) {
    throw new Error(
      `Only allowed to pass in max ${maxDigits - 1} but provided ${digits}`
    );
  } else if (finalDigits < minDigits) {
    throw new Error(`Must pass in minimum ${minDigits} but provided ${digits}`);
  }

  const start = Math.pow(10, digits - 2);
  const randomNumber = Math.floor(start + Math.random() * start * 9);

  prefix = prefix.replace(/(-|_)*\s*$/gi, '');

  return prefix + separator + randomNumber + generateChecksum(randomNumber);
}

module.exports = {
  invArray,
  generateChecksum,
  validateChecksum,
  generateRandomPseudonym,
};
