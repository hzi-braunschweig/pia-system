# psa.server.apigateway

api-gateway is a simple nodejs reverse-proxy that routes the incoming requests to the defined microservices.
It supports microservices routes to be aliased to different additional paths, while keeping the original path in the requests to the backends.
This can be used to introduce new compatibility routes without changing the backend services.

## Test

```shell
npm install
npm run test
npm run test.unit
```

## Configure routing

Open [config.ts](./src/config.ts) to configure routes.
