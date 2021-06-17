const oldFs = require('fs');
const util = require('util');
const writeFile = util.promisify(oldFs.writeFile);

const LicensesConverter = require('./licenses-converter');

function readStdin() {
  return new Promise(function (resolve, reject) {
    const stdin = process.stdin;
    let input = '';
    stdin.setEncoding('utf8');
    stdin.on('data', (chunk) => (input += chunk));
    stdin.on('end', () => resolve(input));
    stdin.on('error', reject);
  });
}

async function writeJsonFile(input) {
  if (!process.argv.indexOf('--out')) {
    throw new Error('You must specify an output path with the --out option');
  }
  const writePath = process.argv[process.argv.indexOf('--out') + 1];
  await writeFile(writePath, JSON.stringify(input));
}

readStdin()
  .then(JSON.parse)
  .then(LicensesConverter.removeUndesiredProperties)
  .then(LicensesConverter.filterOwnPackage)
  .then(LicensesConverter.addKnownMissingLicenseTexts)
  .then(LicensesConverter.wrapArrayInObject)
  .then(writeJsonFile)
  .catch(console.error);
