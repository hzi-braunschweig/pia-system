# psa.service.complianceservice

Compliance service from ewPIA to request and store user consents

## Getting Started

### Requirements

- Linux, MacOS
- nodejs
- npm
- docker
- docker-compose

### Installation

Compliance service will be installed and started in a docker container.

### Build and Run

Use `start.sh` to automatically build and start the Compliance service in a docker container

```
cd pia-ansible/src
./start.sh start complianceservice
```

### Test

- Install dependencies `npm install`
- Run integration tests `npm run test.int`
- Run unit tests `npm run test.unit`

## API Tests

API Tests start their own complianceservice instance and run tests against it. The Database is a in-memory sqlite database.
To connect to this DB set the needed ENVs: EWPIA_DIALECT=sqlite and EWPIA_HOST=:memory:.

### Writing Tests

1. Set the ENVs
2. Import sequelize from dbConfig
3. Run `sequelize.sync({ force: true });` to DROP and CREATE the DB-Tables before each test.
   Make sure to only run this command against the sqlite-in-memory DB!
4. Create the objects you need by using the sequelize models from dbConfig

## Debug

- API Documentation `http://localhost:4010/documentation`
- View service logs `./start.sh logs complianceservice`

## Problems and Solutions

- Add first problem/solution
