/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const secretDetectionReportPath = process.argv[2];
const secretDetectionReportJson = require(`${secretDetectionReportPath}`);

const falsePositives = [
  // There seems to be a bug in detecting Hashicorp Vault service token (everything with ...s.any_text)
  // since analyzers/secrets:3.24.5 (https://gitlab.com/gitlab-org/security-products/analyzers/secrets/-/blob/master/CHANGELOG.md)
  // The issue is reported here https://gitlab.com/gitlab-org/gitlab/-/issues/351714
  // as long as this is not fixed we need to set those issues as false positive
  'psa.app.web/src/app/pages/samples/samples/samples.component.ts:6cede7bb77877c5fed36e38c786a233313b737d1ff120bc4af42706f8a713311:Hashicorp Vault service token',
  'psa.lib.service-core/dist/src/plugins/registerPlugins.js:be490c3fbe8370c45a40eaa14243498bc6938817d0a7e3e3e4a84da5f31d0c1e:Hashicorp Vault service token',
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
