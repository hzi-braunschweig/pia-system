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

  // ignore examples from THIRD_PARTY_LICENSES
  'THIRD_PARTY_LICENSES:0247e0ba1bc51c46f6f36ee4d0211cf0560b29ec7bd35a4c2031f782b97e3242:Password in URL',
  'THIRD_PARTY_LICENSES:02f3c2b99cd141af2fee9607032267c61a9293ca6d99e80b0b5eecd7528d84e3:Password in URL',
  'THIRD_PARTY_LICENSES:036d9d144fa00fafbf493c4df00a987df40bceba6cadf300fdc26e3be4c87663:Password in URL',
  'THIRD_PARTY_LICENSES:880733c6a1a29e52443f38bcc18a11f813511d4e3b58e92d30e21805a6b673cb:Password in URL',
  'THIRD_PARTY_LICENSES:b2e3d3f8df29a76f67932f31239f41f6f21cf50ff619be75bb704a7c963fda6d:Password in URL',
  'THIRD_PARTY_LICENSES:b425e1e054ba9ece880075e861a6d5e904b34d45807b7186213f1b345f5af9b3:Password in URL',
  'THIRD_PARTY_LICENSES:d0d77365b7544e3eab8c4201ccfee365e3d86f02d08f13ba0227d84adc6499b5:Password in URL',
  'THIRD_PARTY_LICENSES:c253d5a679a4ab6940de64f31b4cb006a02add8bb2b621395143c9e1c48f362e:Password in URL',

  // ignored example for k8s
  'k8s/deployment/components/example-pia-config/kustomization.yaml:3021d90eb9437b2d8f30e8363695c4418b5e5f1870801b5c317e9398ee0f572d:PKCS8 private key',
  'k8s/deployment/overlays/pia-release/kustomization.yaml:3021d90eb9437b2d8f30e8363695c4418b5e5f1870801b5c317e9398ee0f572d:PKCS8 private key',

  // ignore fake firbase credential for tests
  'psa.service.notificationservice/tests/fixtures/firebase-dummy-credential.json:3021d90eb9437b2d8f30e8363695c4418b5e5f1870801b5c317e9398ee0f572d:PKCS8 private key',
  'ci/e2e.yml:3021d90eb9437b2d8f30e8363695c4418b5e5f1870801b5c317e9398ee0f572d:PKCS8 private key',

  // ignore GCP API Keys, as they are public keys - https://groups.google.com/g/firebase-talk/c/bamCgTDajkw/m/uVEJXjtiBwAJ
  'psa.app.web/src/firebase-messaging-sw.js:789291b97012fbd1bc4c3b799fe241fe914b7e852e5a20a33b999e9a09eb3016:GCP API key',
  'psa.app.web/src/environments/environment.base.ts:789291b97012fbd1bc4c3b799fe241fe914b7e852e5a20a33b999e9a09eb3016:GCP API key',
  'psa.app.mobile/google-services.json:4b39945706f3f6393dc018c2d59410a55e4a32867df8351f8529b7c32ab607a0:GCP API key',
];

if (hasVulnerabilities(secretDetectionReportJson)) {
  const positives = secretDetectionReportJson.vulnerabilities.filter(
    (vulnerability) => !falsePositives.includes(vulnerability.cve)
  );

  const totalLength = secretDetectionReportJson.vulnerabilities.length;
  if (positives.length === 0) {
    console.log(
      `All ${totalLength} vulnerabilities are known false positives.`
    );
  } else {
    console.log(
      `Of ${totalLength} vulnerabilities ${positives.length} are not false positives.`
    );
    console.error(positives);
    process.exit(1);
  }
} else {
  console.log('No vulnerabilities found.');
}

function hasVulnerabilities(reportJson) {
  return reportJson?.vulnerabilities?.length > 0;
}
