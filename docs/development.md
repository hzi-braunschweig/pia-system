# Development

> ⚠️ **Work in progress** This document is still work in progress and will be extended over time.

## Prerequisites

For local development you need to have the following tools installed:

- [Node.js with NPM](https://nodejs.org/) to manage the service's dependencies and run development related scripts
  - We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage your node installations
  - After installation, you can set the correct node version by running `nvm use` in the root directory
- Local [k3d](https://k3d.io/) Kubernetes cluster to which PIA will be deployed
  - You might also use other Kubernetes distributions, however, our setup is only tested with k3d
- [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) to control your cluster
- [Skaffold](https://skaffold.dev/docs/install/) to deploy PIA to your cluster with one command. Please see [Tips for skaffold](#tips-for-skaffold)
  for additional information.
- Optional: [Android Studio](https://developer.android.com/studio) and/or [Xcode](https://developer.apple.com/xcode/) to
  build the mobile apps. For detailed instructions see the [mobile app readme](../psa.app.mobile/README.md).

After you installed all tools, you need to install dependencies by running `npm install` in the `k8s` directory:

```bash
cd k8s
npm install
```

Also create a local cluster with k3d:

```bash
k3d cluster create pia --port 80:80@loadbalancer --port 443:443@loadbalancer
```

Before you can access your local PIA, you need to also add `pia-app` and `mail-pia-app` with the IP `127.0.0.1` to your
hosts file:

```/etc/hosts
127.0.0.1	pia-app
127.0.0.1	mail-pia-app
```

> ℹ️ Due to certain restrictions it is not possible to access PIA locally via `localhost`.

## Startup

> ⚠️ This is **only for local development**. Do _not_ use this for production setups, instead check
> the [deployment docs](../docs/deployment.md).

Run `npm start` or `skaffold dev` to deploy PIA to your local cluster. This will:

1. Build all Docker images which are needed for the deployment
2. Create the namespace **pia** if it does not exist
3. Generate mandatory internal secrets for your local deployment
   - This will create `k8s/deployment/overlays/local-k3d/internal-secrets.yaml` if it is not yet existing
4. Deploy the Kubernetes manifests to your cluster using the locally built images
5. Keep your cluster up to date after code changes (as long as the script is running)
6. Clean up all resources after you stop the script (by pressing `Ctrl + C`)
   - This can be skipped by starting Skaffold with `--cleanup=false`
7. For mobile app development, you need to create and add local TLS certificate. Go to [How to add a local TLS certificate for SSL termination](#how-to-add-a-local-tls-certificate-for-ssl-termination) for more information.

After all services are up and running, you can access:

- **PIA Admin UI** at [https://pia-app/admin/](https://pia-app/admin/)
  - For the first login, you need to create a SysAdmin (see [Creating the First User](./create-first-user.md))
- **PIA Participant UI** at [https://pia-app/](https://pia-app/)
- **Mailhog** at [https://pia:test@mail-pia-app/](https://pia:test@mail-pia-app/)
  - Mailhog will show you all mails which were sent by your local PIA. No mails are actually sent.

## How to add a local TLS certificate for SSL termination

We suggest to use [mkcert](https://github.com/FiloSottile/mkcert) for creating and confirming your own, local root CA.
This way you can create your own certificates for your local development environment.

1. Install mkcert by following the instructions on the [GitHub page](https://github.com/FiloSottile/mkcert?tab=readme-ov-file#installation)
2. Run `mkcert -install` to install the root certificate
3. Run `npm run generate-local-tls-certificates:k3d` to generate your local certificates. This will create the following files:
   - `k8s/deployment/overlays/local-k3d/pia-app-key.pem`
   - `k8s/deployment/overlays/local-k3d/pia-app.pem`
4. Add the generated certificate to your local ingress resources by running the following commands in `k8s/`:

```bash
kubectl create -n pia secret tls ingress-tls --key deployment/overlays/local-k3d/pia-app.key --cert deployment/overlays/local-k3d/pia-app.crt
kubectl create -n pia secret tls ingress-mailhog-tls --key deployment/overlays/local-k3d/pia-app.key --cert deployment/overlays/local-k3d/pia-app.crt
```

## Tips for skaffold

> 🌈 You can opt out of skaffolds metrics collection by executing `skaffold config set --global collect-metrics false`.

> 👯‍ We have limited concurrency to avoid overloading network and CPU for new developors. You can disable this limit
> appending `--build-concurrency 0` when executing skaffold to utilize all available resources.

## How to add a service

A dockerized node service can be added by creating a new directory and placing the corresponding sources, `Dockerfile`
and `package.json` into it.

[`psa.utils.repo-tool generate`](../psa.utils.repo-tool) will automatically adjust the gitlab pipelines.
It will also include unit-/integration-tests and linting if specified in the `package.json`.

For the deployment the new service has to be added
to [docker-compose.yml.j2](./pia-ansible/roles/pia/templates/docker-compose.yml.j2).

If the service requires a certificate [generate-secrets](./psa.utils.scripts/generate-secrets/) must be updated to
create a certificate for that service.

For the service to be reachable from the outside, the routes to that service have to be configured inside
the [apigateway](./psa.server.apigateway/src/config.ts).

### Offering Public API

If a service needs to offer endpoints via PIAs [Public API](../README.md#public-api), you must implement them
with [tsoa](https://tsoa-community.github.io/docs/introduction.html) to enable automated generation and merging for the
root [OpenAPI document](./openapi.yaml) and to allow our CI pipeline to ensure it is always up-to-date.

You can refer to the [guide on adding tsoa into an existing service](./docs/adding-tsoa-to-an-existing-service.md) for
detailed steps.

### Local dependencies

A service can use a library that is included in this monorepo.
To utilize that functionality you can install the library using relative paths.

```bash
psa.service.code-sharing-example$ npm install --save ../psa.lib.code-sharing-example/
```

Inside the `Dockerfile` of `psa.service.code-sharing-example` the dependent lib has to be copied before the `npm ci`
call:

```dockerfile
WORKDIR /usr/src/node-app/

ARG DIR=

COPY $DIR/package.json package.json
COPY $DIR/package-lock.json package-lock.json

#copy dependencies
COPY psa.lib.code-sharing-example/ ../psa.lib.code-sharing-example

RUN npm ci --omit=dev
```

After that [`psa.utils.repo-tool generate`](./psa.utils.repo-tool) has to be executed to update the
generated [dockerfiles](./psa.utils.repo-tool/generated/).
