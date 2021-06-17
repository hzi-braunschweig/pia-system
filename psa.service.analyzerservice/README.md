# psa.service.analyzerservice

Analyzer service watches and reacts to db changes

- checks questionnaire answers and reacts (send notifications, create conditional questionnaire instances)
- checks questionnaire and user updates and creates questionnaire instances
- set questionnaire instances to active when trigger date has come

## Getting Started

### Requirements

- Linux, MacOS
- nodejs
- npm
- docker
- docker-compose

### Installation

Analyzer service is installed and started in a docker container.

### Build and Run

Use `start.sh` to automatically build and start the analyzer service in a docker container

```
cd pia-ansible/local
./start.sh start analyzerservice
```

### Test

- Install dependencies `npm install`
- Run integration tests `npm run test.int`
- Run unit tests `npm run test.unit`

## Docs and Debug

- View service logs `./start.sh logs analyzerservice`

## Problems and Solutions

- Add first problem/solution
