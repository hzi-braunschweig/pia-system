# psa.service.sormasservice

Sormas service enables an integration with an external SORMAS instance. It watches and reacts to db changes

- checks questionnaire answers and reacts (send visit reports to SORMAS)

## Getting Started

### Requirements

- Linux, MacOS
- nodejs
- npm
- docker
- docker-compose

### Installation

Sormas service is installed and started in a docker container.

### Build and Run

Use `start.sh` to automatically build and start the sormas service in a docker container

```
cd pia-ansible/src
./start.sh start sormasservice
```

### Test

- Install dependencies `npm install`
- Run integration tests `npm run test.int`
- Run unit tests `npm run test.unit`

## Docs and Debug

- View service logs `./start.sh logs sormasservice`

## Problems and Solutions

- Add first problem/solution
