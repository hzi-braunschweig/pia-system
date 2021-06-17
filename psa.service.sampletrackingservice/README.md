# psa.service.sampletrackingservice

Sample tracking service periodically loads all hl7 and CSV labResults from sftp servers, parses them and saves them to qpia.
It also provides api endpoints for bio sample submittance and labresults

## Getting Started

### Requirements

- Linux, MacOS
- nodejs
- npm
- docker
- docker-compose

### Installation

Sample tracking service is installed and started in a docker container.

### Build and Run

Use `start.sh` to automatically build and start the sample tracking service in a docker container

```
cd pia-ansible/src
./start.sh start sampletrackingservice
```

### Test

- Install dependencies `npm install`
- Run integration tests `npm run test.int`
- Run unit tests `npm run test.unit`

## Docs and Debug

- API Documentation `http://localhost:4006/documentation`
- View service logs `./start.sh logs sampletrackingservice`

## Problems and Solutions

- Add first problem/solution
