# psa.service.sampletrackingservice

Sample tracking service periodically loads all hl7 and CSV labResults from sftp servers, parses them and saves them to qpia.
It also provides api endpoints for bio sample submittance and labresults

## Getting Started

### Development

See [development documentation](../docs/development.md).

### Test

- Install dependencies `npm install`
- Run integration tests `npm run test.int`
- Run unit tests `npm run test.unit`
