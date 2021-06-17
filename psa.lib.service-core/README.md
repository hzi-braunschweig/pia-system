# psa.lib.service-core

@pia/lib-service-core contains the main building blocks for all PIA microservices:

- **auth**: authorization validation strategies
- **config**: global configuration, configuration schema and utilities
- **db**: helper components for stable database listeners and consistent transaction handling
- **plugins**: shared hapi plugins
- **utils**: general utility methods und typescript types

This library by definition _does not_ contain any domain specific application logic. These should be implemented in domain specific libraries.

## Installation

@pia/lib-service-core is not yet published to any NPM registry. Thus we install it only locally:

```shell
npm install @pia/lib-service-core@file:../psa.lib.service-core
```

For the CI to be able to build the dependent service with this package, you need to add it to the corresponding Docker container:

```Dockerfile
FROM node:14.16.1-alpine AS base

...

ARG DIR=.
COPY $DIR/package*.json ./
#copy dependencies' package.json
COPY --chown=node:node psa.lib.service-core/package.json ../psa.lib.service-core/

RUN npm ci --production
#copy dependencies' source
COPY --chown=node:node psa.lib.service-core/dist ../psa.lib.service-core/dist

FROM base AS build

...

RUN npm ci

#copy dev dependencies' source
COPY --chown=node:node psa.lib.service-core/tsconfig.global.json ../psa.lib.service-core/
```

## Usage

For usage hints please consult the corresponding code documentation or have a look into the example-service in `/tests`.

### Transaction example

#### DB Config

```ts
// db.js
export const db = pgp(config.configJson.services.ipia);
export const runTransaction = createTransactionRunner(db);
export const getDbTransactionFromOptionsOrDbConnection =
  RepositoryHelper.createDbConnectionGetter(db);
```

#### Interactor

```ts
import { runTransaction } from '@pia/lib-service-core';

class DeletionInteractor {
  static executeDeletion(deletion) {
    return runTransaction(async (transaction) => {
      await PersonalDataRepository.deletePersonalData(deletion.proband_id, {
        transaction,
      });
      // ...
    });
  }
}
```

#### Repository

```ts
import {
  getDbTransactionFromOptionsOrDbConnection,
  RepositoryOptions,
} from '@pia/lib-service-core';

class PersonalDataRepository {
  static async deletePersonalData(
    pseudonym: string,
    options: RepositoryOptions
  ) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    await db.none('DELETE FROM personal_data WHERE pseudonym = $(pseudonym)', {
      pseudonym,
    });
  }
}
```
