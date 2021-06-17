# psa.service.personaldataservice

Service for personal data from iPIA

## Getting Started

### Requirements

- Linux, MacOS
- nodejs
- npm
- docker
- docker-compose

### Installation

Personal data service is installed and started in a docker container.

### Build and Run

Use `start.sh` to automatically build and start the Personal data service in a docker container

```
cd pia-ansible/src
./start.sh start personaldataservice
```

### Test

- Install dependencies `npm install`
- Run integration tests `npm run test.int`
- Run unit tests `npm run test.unit`

## Docs and Debug

- API Documentation `http://localhost:4007/documentation`
- View service logs `./start.sh logs personaldataservice`

## Problems and Solutions

- Add first problem/solution
