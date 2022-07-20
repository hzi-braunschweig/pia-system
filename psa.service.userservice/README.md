# psa.service.userservice

User service manages users

## Getting Started

### Requirements

- Linux, MacOS
- nodejs
- npm
- docker
- docker-compose

### Installation

User service is installed and started in a docker container.

### Build and Run

Use `start.sh` to automatically build and start the user service in a docker container

```
cd pia-ansible/src
./start.sh start userservice
```

### Test

- Install dependencies `npm install`
- Run integration tests `npm run test.int`
- Run unit tests `npm run test.unit`

## Docs and Debug

- API Documentation `http://localhost:4001/documentation`
- View service logs `./start.sh logs userservice`

## Problems and Solutions

- Add first problem/solution
