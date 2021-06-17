# psa.service.questionnaireservice

Questionnaire service manages questionnaires

## Getting Started

### Requirements

- Linux, MacOS
- nodejs
- npm
- docker
- docker-compose

### Installation

Questionnaire service is installed and started in a docker container.

### Build and Run

Use `start.sh` to automatically build and start the questionnaire service in a docker container

```
cd pia-ansible/src
./start.sh start questionnaireservice
```

### Test

- Install dependencies `npm install`
- Run integration tests `npm run test.int`
- Run unit tests `npm run test.unit`

## Docs and Debug

- API Documentation `http://localhost:4003/documentation`
- View service logs `./start.sh logs questionnaireservice`

## Problems and Solutions

- Add first problem/solution
