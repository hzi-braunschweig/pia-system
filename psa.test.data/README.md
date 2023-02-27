# pia-api-scripts

Scripts to execute commands against the PIA API - e.g. generation of test data

## Command `seed`

You can start the `seed` command by running:

```shell
npm start -- seed \
    --host pia-app \
    --admin-user AdminUser \
    --admin-password AdminPassword \
    --keycloak-user KeycloakAdmin \
    --keycloak-password KeycloakPassword \
    --study-prefix LOCAL \
    --studies-count 2 \
    --probands-count 10
```

It will create 2 new studies with 10 users each on your local instance `pia-app`, using study prefix LOCAL.

Replace `AdminUser`/`AdminPassword` with an existing PIA admin and `KeycloakAdmin`/`KeycloakPassword` with an existing
Keycloak admin.

Per default all created probands will be saved to `probands.json`. You can overwrite the filename and path by
setting `--probands-export-file` (`-pef`).

Optionally you can set `--blood-samples-count` to create blood samples and `--submit-answers` to randomly answer
questions for each proband.

The number of questionnaires per study is set to 1. You can set `--questionnaires-count` to either another value,
or an array of values to set how many questionnaires each study should have. For example when settings
`--studies-count 4` you can set `--questionnaires-count 2,2,4,1` to set the number of questionnaires for each study.

For more information run `npm start -- --help` and `npm start -- help seed`

**Example for creating 2000 probands, distributed across 4 studies, with answers for e.g. load testing:**

```shell
 npm start -- seed \
  --host some-host.local \
  --admin-user sysadmin \
  --admin-password 123456 \
  --keycloak-user admin \
  --keycloak-password admin \
  --study-prefix LOADTEST \
  --studies-count 4 \
  --submit-answers \
  --probands-count 500
```
