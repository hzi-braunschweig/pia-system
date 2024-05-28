# Adding tsoa to an existing service

1. open the service's root directory
2. Run `npm install tsoa`
3. Add `spec/` to `.gitignore`
4. Add the following `tsoa.json` to the service's root:

   ```json
   {
     "entryFile": "src/index.ts",
     "noImplicitAdditionalProperties": "throw-on-extras",
     "controllerPathGlobs": ["src/controllers/**/*Controller.ts"],
     "spec": {
       "outputDirectory": "spec",
       "specFileBaseName": "openapi",
       "specVersion": 3,
       "yaml": true,
       "basePath": "/api/v1",
       "version": "1",
       "tags": [],
       "securityDefinitions": {
         "jwt-public": {
           "type": "oauth2",
           "flows": {
             "clientCredentials": {
               "tokenUrl": "api/v1/auth/realms/pia-admin-realm/protocol/openid-connect/token",
               "scopes": {}
             }
           }
         }
       }
     },
     "routes": {
       "middleware": "hapi",
       "routesDir": "src",
       "routesFileName": "publicRoutes.generated.ts",
       "authenticationModule": "./src/auth.ts"
     }
   }
   ```

5. Add the following npm scripts to the service's `package.json`:

   ```json5
   {
     //...
     'tsoa.watch': 'tsoa routes -w && tsoa spec -w',
     'build.local': 'npm run build',
     'prebuild.local': 'npm run build.routes && npm run build.openapi',
     'pretest.int': 'npm run build.routes',
     'build.openapi': 'tsoa spec',
     'build.routes': 'tsoa routes',
     'postbuild.routes': 'echo "// @ts-nocheck" > temp.ts && cat src/publicRoutes.generated.ts >> temp.ts && mv temp.ts src/publicRoutes.generated.ts',
   }
   ```

6. Copy the `tsoa.json` to the Dockerfile's build step:

   ```dockerfile
   FROM install AS build

   COPY $DIR/tsconfig*.json ./
   COPY $DIR/tsoa.json ./
   COPY $DIR/src ./src
   RUN npm run build
   ```

7. Create the auth strategy configuration under `src/auth.ts` with the following content:

   ```typescript
   /*
    * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
    *
    * SPDX-License-Identifier: AGPL-3.0-or-later
    */
   import Hapi from '@hapi/hapi';
   import { config } from './config';
   import { AccessToken, PublicApiAuthenticator } from '@pia/lib-service-core';

   export const hapiAuthentication = async (
     request: Hapi.Request,
     securityName: string
   ): Promise<AccessToken> =>
     await PublicApiAuthenticator.authenticate(
       securityName,
       request,
       config.servers.authserver.adminTokenIntrospectionClient
     );
   ```

8. Create your first tsoa controller under `src/controllers/`
   - [example controller](../psa.service.userservice/src/controllers/public/participantController.ts)
   - [official docs](https://tsoa-community.github.io/docs/getting-started.html#defining-a-simple-controller)
9. Generate the routes and spec with `npm run build.local`
10. Register the generated routes in the service's `src/server.ts`:

    ```typescript
    import { RegisterRoutes } from './publicRoutes.generated'; // <-- add this line
    /*...*/
    this.instance = Hapi.server({
      /*...*/
    });
    await registerAuthStrategies(this.instance, config.servers.authserver);
    await registerPlugins(this.instance, {
      /*...*/
    });
    RegisterRoutes(this.instance); // <-- add this line
    ```

11. Add your public API routes to the [apigateway](../psa.server.apigateway/src/config.ts).

    ```typescript
    const routes: ProxyRouteConfig[] = [
      /*...*/
      {
        path: publicApiPath + 'studies/:studyName/example-endpoint',
        upstream: {
          host: 'exampleservice',
          path: publicUpstreamPath + 'studies/:studyName/example-endpoint',
          protocol: getProtocol(),
          port: ConfigUtils.getEnvVariableInt('EXAMPLESERVICE_PORT'),
        },
      },
      /*...*/
    ];
    ```

12. Add the generated routes file to the service's `.nycrc.json` to exclude it from test coverage:

    ```json5
    {
      // ...
      exclude: ['**/*.spec.*', 'src/index.*', 'src/publicRoutes.generated.ts'],
    }
    ```

13. Start the service and access the new API

14. Update the main [`openapi.yml`](../docs/openapi.yml) by running `npm run update-openapi` in the project root

15. [`psa.utils.repo-tool generate`](./psa.utils.repo-tool) needs to be run, for the service to be added to the list of OpenAPI services
