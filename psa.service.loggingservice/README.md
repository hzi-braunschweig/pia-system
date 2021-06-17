# psa.service.loggingservice

Logging service logs activity of probands and professional roles

- login
- logout
- save, release and final release questionnaire

## Getting Started

### Requirements

- Linux, MacOS
- nodejs
- npm
- docker
- docker-compose
- TODO Add services and link them

### Installation

Logging service will be installed and started in a docker container.

### Build and Run

Use `start.sh` to automatically build and start the Logging service

```
cd pia-ansible/src
./start.sh start loggingservice
```

### Test

- Install dependencies `npm install`
- Run integration tests `npm run test.int`

## Docs and Debug

- API Documentation `http://localhost:4008/documentation`
- View service logs `./start.sh logs loggingservice`

## Problems and Solutions

- Add first problem/solution here
