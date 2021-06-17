# psa.utils.repo-tool

The repo-tool scans the directories under `REPO_DIR` for `Dockerfile` and `package.json`.
With the gathered information it can run various tasks on the repository.

## Usage

```bash
npm run build && npm start -- $COMMAND
```

## Generator

This is a generator for a `.gitlab-ci.yml` file.
With the found files and the templates from the `templates` directory, it creates jobs for a `.gitlab-ci.yml`.
It also creates dockerfiles, that are used inside the ci (and local tests), under the `generated` folder.

```bash
npm run generate
```

### NOTE

we can not use docker run with mounted files from the repo in the ci because the ci is executed inside a container.
This means the paths we see there are not the real paths on the host.
Therefore, we don't know the real paths on the host and can not mount them inside a docker run.

## Test

This command can be used to run all the tests on the local developer machine.

```bash
npm run test
```

## Update

Can be used to run `npm update` on all services.

```bash
npm run update
```

## Outdated

Can be used to run `npm outdated` on all services.

```bash
npm run outdated
```

## Licensecollector

The licensecollector is gathering all the licenses of the npm packages that are used in this project.
It **does not** collect licenses for other tools that are used (e.g. PostgreSQL, native iOS or Android dependencies).

To run the licensecollector locally you first have to run `npm ci` in **ALL** directories.
Then you can run `npm run build && npm run license` to generate the `licenses.csv`.
Because the licensecollector is using the currently installed `node_modules` the `npm ci` command should always be executed after changing dependencies.
Otherwiese there is a high risk that the `license.csv` is outdated.

## Scan Routes

Collects all OpenAPI specs from any microservice of a local PIA instance (with open Ports 4000 to 4015) and merges
all API route definitions into one CSV file, named `route-meta-data.csv`.
This file can be used as an overview of all (public) API routes of PIA.

```bash
npm run scan-routes
```
