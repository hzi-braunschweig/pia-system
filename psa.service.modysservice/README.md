# psa.service.modysservice

Imports data from external MODYS systems

- scheduled data imports from external MODYS to internal personaldataservice

## Getting Started

### Requirements

- Linux, MacOS
- nodejs
- npm
- docker
- docker-compose

### Installation

Modysservice will be installed and started in a docker container.

### Build and Run

Use `start.sh` to automatically build and start the External data service in a docker container

```
cd pia-ansible/local
./start.sh start modysservice
```

### Test

- Install dependencies `npm install`
- Run integration tests `npm run test.int`
- Run unit tests `npm run test.unit`

## Debug

- View service logs `./start.sh logs modysservice`

## Problems and Solutions

- Add first problem/solution
