# psa.service.notificationservice

Notification service reacts to db updates or API requests and sends push notifications or emails

## Getting Started

### Requirements

- Linux, MacOS
- nodejs
- npm
- docker
- docker-compose

### Installation

Notification service will be installed and started in a docker container.

### Build and Run

Use `start.sh` to automatically build and start the Notification service

```
cd pia-ansible/src
./start.sh start notificationservice
```

### Test

- Install dependencies `npm install`
- Run integration tests `npm run test.int`
- Run unit tests `npm run test.unit`

## Docs and Debug

- API Documentation `http://localhost:4005/documentation`
- View service logs `./start.sh logs notificationservice`

## Problems and Solutions

- Add first problem/solution
