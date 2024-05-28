# psa.service.analyzerservice

Analyzer service watches and reacts to db changes

- checks questionnaire answers and reacts (send notifications, create conditional questionnaire instances)
- checks questionnaire and user updates and creates questionnaire instances
- set questionnaire instances to active when trigger date has come

## Getting Started

### Development

See [development documentation](../docs/development.md).

### Test

- Install dependencies `npm install`
- Run integration tests `npm run test.int`
- Run unit tests `npm run test.unit`
