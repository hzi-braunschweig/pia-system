/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const fs = require('fs');
const path = require('path');

// we need to fix some reports
// otherwise `nyc report -v --reporter text -t coverage` gives us:
// Invalid file coverage object, missing keys, found:data

function fixFile(fileName) {
  const data = JSON.parse(fs.readFileSync(fileName).toString());

  for ([key, value] of Object.entries(data)) {
    if (value.data) {
      data[key] = value.data;
    }
  }

  fs.writeFileSync(fileName, JSON.stringify(data));
}

const coverageDir = process.env.COVERAGE_DIR || 'coverage';

for (const file of fs.readdirSync(coverageDir)) {
  fixFile(path.join(coverageDir, file));
}
