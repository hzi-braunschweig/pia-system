const secretDetectionReportPath = process.argv[2];
const secretDetectionReportJson = require(`${secretDetectionReportPath}`);

const falsePositives = [
  'psa.lib.service-core/tests/private.key:8bcac7908eb950419537b91e19adc83ce2c9cbfdacf4f81157fdadfec11f7017:RSA private key',
  'psa.service.authservice/tests/unit/private.key:8bcac7908eb950419537b91e19adc83ce2c9cbfdacf4f81157fdadfec11f7017:RSA private key',
];

if (hasVulnerabilities(secretDetectionReportJson)) {
  console.log(
    'Found ' +
      secretDetectionReportJson.vulnerabilities.length +
      ' vulnerabilities:'
  );
  if (hasOnlyFalsePositives(secretDetectionReportJson.vulnerabilities)) {
    console.log('All vulnerabilities are known false positives.');
  } else {
    console.error(secretDetectionReportJson?.vulnerabilities);
    process.exit(1);
  }
} else {
  console.log('No vulnerabilities found.');
}

function hasVulnerabilities(reportJson) {
  return reportJson?.vulnerabilities?.length > 0;
}

function hasOnlyFalsePositives(vulnerabilities) {
  return vulnerabilities.every((vulnerability) =>
    falsePositives.includes(vulnerability.cve)
  );
}
