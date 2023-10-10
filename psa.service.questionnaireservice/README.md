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
cd pia-ansible/local
./start.sh start questionnaireservice
```

### Test

- Install dependencies `npm install`
- Run integration tests `npm run test.int`. Possibly ipv6 has to be disabled to run the integration tests:

```
  sysctl -w net.ipv6.conf.all.disable_ipv6=1
  sysctl -w net.ipv6.conf.default.disable_ipv6=1
```

- Run unit tests `npm run test.unit`

## Docs and Debug

- API Documentation `http://localhost:4003/documentation`
- View service logs `./start.sh logs questionnaireservice`

## Problems and Solutions

- Add first problem/solution
