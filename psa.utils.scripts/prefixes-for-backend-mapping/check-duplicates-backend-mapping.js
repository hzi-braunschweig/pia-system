/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const dataArray = [
  { prefix: 'TCSG', url: 'https://train-sb.sormas.ch' },
  { prefix: 'TSSW', url: 'https://test-sb.sormas.ch' },
];

function checkDuplicates(arr) {
  let lowerCasePrefixes = arr.map((item) => item.prefix.toLowerCase());
  let seen = new Set();
  let hasDuplicate = false;
  for (let prefix of lowerCasePrefixes) {
    if (seen.has(prefix)) {
      console.log('Duplicate: ', prefix);
      hasDuplicate = true;
    }
    seen.add(prefix);
  }
  return hasDuplicate;
}

const hasDuplicates = checkDuplicates(dataArray);
console.log('Array has duplicates:', hasDuplicates);
