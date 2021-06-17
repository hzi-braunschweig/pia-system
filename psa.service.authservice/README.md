# psa.service.authservice

Authservice manages authentication and password management

## Getting Started

### Requirements

- Linux, MacOS
- nodejs
- npm
- docker
- docker-compose

### Installation

Auth service will be installed and started in a docker container.

### Build and Run

Use `start.sh` to automatically build and start the Auth service in a docker container

```
cd pia-ansible/src
./start.sh start authservice
```

### Test

- Install dependencies `npm install`
- Run integration tests `npm run test.int`
- Run unit tests `npm run test.unit`

## Debug

- API Documentation `http://localhost:4010/documentation`
- View service logs `./start.sh logs authservice`

## Key generation

The JWT signature is asymmetrically encrypted. The keys in authKey can be generated by the following commands:

```shell script
openssl genrsa -out private.key 2048
openssl rsa -in private.pem -pubout -out public.pem
```

## Debug

- API Documentation `http://localhost:4002/documentation`
- View service logs `./start.sh logs authservice`