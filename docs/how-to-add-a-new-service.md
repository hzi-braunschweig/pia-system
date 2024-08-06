# How To Add a New Service

A dockerized Node.js service can be added by creating a new directory and placing the corresponding sources,
`Dockerfile` and `package.json` into it.

## Configuration for Kubernetes

For the new service to be deployed it needs to be added to the `k8s/src/pia/deployment` directory and initialized in `k8s/src/main.ts`.
Please check, whether any Kustomize component or overlay needs to be adjusted.

Add an image entry to the [template](../k8s/utils/overlay-template.yaml) used in the `create-overlay.sh` script:

```yaml
images:
  # ...
  - name: registry.hzdr.de/pia-eresearch-system/pia/psa.service.exampleservice
    newName: {dockerRegistryPath}/psa.service.exampleservice
    newTag: {dockerImageTag}
```

Also add an image entry to the skaffold.yaml:

```yaml
build:
  # ...
  artifacts:
    # ...
    - image: registry.hzdr.de/pia-eresearch-system/pia/psa.service.exampleservice
      context: .
      docker:
        dockerfile: psa.service.exampleservice/Dockerfile
        buildArgs:
          DIR: psa.service.exampleservice
```

For the service to be reachable from the outside, the routes to that service have to be configured inside the [apigateway](../psa.server.apigateway/src/config.ts).

## Dockerfile

In the privacy policy of PIA we have strict rules regarding the logs of emails and ip addresses. To prevent the logging of emails and ip addresses we have a bash masking script [generate-internal-secrets](../psa.utils.scripts/logs-masking/custom-entrypoint.sh). The script has to be copied to the docker image and run in the `ENTRYPOINT` of the dockerfile. Furthermore, `bash` and `sed` (GNU version of sed that support `-u` option) needs to be installed in the dockerfile (if not already included). The script takes the original entrypoint file of the docker image as a first parameter (see e.g. [Dockerfile](../psa.service.userservice/Dockerfile).).

## Internal Library Dependencies

A service can use a library that is included in this monorepo.
To utilize that functionality you can install the library using relative paths.

```bash
psa.service.code-sharing-example$ npm install --save ../psa.lib.code-sharing-example/
```

Inside the `Dockerfile` of `psa.service.code-sharing-example` the dependent lib has to be copied before the `npm ci` call:

```dockerfile
WORKDIR /usr/src/node-app/

ARG DIR=

COPY $DIR/package.json package.json
COPY $DIR/package-lock.json package-lock.json

#copy dependencies
COPY psa.lib.code-sharing-example/ ../psa.lib.code-sharing-example

RUN npm ci --omit=dev
```

## Update CI configuration

Finally, you need to run the following [`psa.utils.repo-tool`](../psa.utils.repo-tool) scripts to update configuration files:

### Update [./ci/generated.yaml](../ci/generated.yml):

`npm run generate`

Adds necessary docker, unit-/integration-tests and linting entries.

### Update [./bake.hcl](../bake.hcl):

`npm run generate-hcl`

Adds an entry for your new service to all necessary build images.
