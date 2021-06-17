# psa.service.externaldataservice

Service for personal data from MODYS

- scheduled data imports from external MODYS to internal personaldataservice

## Getting Started

### Requirements

- Linux, MacOS
- nodejs
- npm
- docker
- docker-compose

### Installation

External data service will be installed and started in a docker container.

### Build and Run

Use `start.sh` to automatically build and start the External data service in a docker container

```
cd pia-ansible/src
./start.sh start externaldataservice
```

### Test

- Install dependencies `npm install`
- Run integration tests `npm run test.int`
- Run unit tests `npm run test.unit`

## Debug

- View service logs `./start.sh logs externaldataservice`

## Problems and Solutions

- Add first problem/solution
