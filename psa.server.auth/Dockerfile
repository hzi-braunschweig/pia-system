FROM maven:3.8.5-openjdk-17@sha256:62e6a9e10fb57f3019adeea481339c999930e7363f2468d1f51a7c0be4bca26d as extension-builder

ARG DIR=.

RUN mkdir /build
WORKDIR /build

COPY ${DIR}/extensions/keycloak-study-registration/ ./

RUN --mount=type=cache,target=/root/.m2 mvn clean package -Dmaven.test.skip=true

################################################################

FROM node:20.3.0-alpine@sha256:2d5e8a8a51bc341fd5f2eed6d91455c3a3d147e91a14298fc564b5dc519c1666 as theme-builder

ARG DIR=.

RUN mkdir /build
WORKDIR /build

COPY ${DIR}/themes/ ./themes/
COPY ${DIR}/package*.json ./
COPY psa.app.web/.browserslistrc ./

RUN npm ci \
    && npm run theme:build \
    && rm -rf ./themes/scss \
    && rm -rf ./themes/pia/login/resources/scss/

################################################################

FROM curlimages/curl@sha256:4a3396ae573c44932d06ba33f8696db4429c419da87cbdc82965ee96a37dd0af AS dl-keycloak-config-cli

WORKDIR /dl
#
# `keycloak-config-cli-24.0.1.jar` is the latest version, which is compatible with Java 17.
# `keycloak-config-cli-24.0.5.jar` requires Java 21, which is not supported by the official Keycloak docker image.
#
# The project is using the Keycloak version number to express against which Keycloak version the tool is tested in thier CI.
# Therefore there is no harm in using `keycloak-config-cli` for Keycloak in version 24.0.1 with Keycloak in version 24.0.5,
# as long as the minor version does not change how Keycloak is configured or new features are introduced.
#
RUN curl -L -o ./keycloak-config-cli.jar https://github.com/adorsys/keycloak-config-cli/releases/download/v5.12.0/keycloak-config-cli-24.0.1.jar
RUN echo "48069c527b3c26f3fc56299cb518e410d324ee7a16abb9276c920f013ae7b46d keycloak-config-cli.jar" | sha256sum -c

################################################################

FROM quay.io/keycloak/keycloak:24.0.5@sha256:c916c668a5cd589948c3310ab31ffcfc5da55f0e546028f2f606419ce17c6ad8

ARG DIR=.

ENV KEYCLOAK_BACKEND_PORT 4000

COPY --from=dl-keycloak-config-cli /dl/keycloak-config-cli.jar /keycloak-config-cli.jar
COPY --from=theme-builder /build/themes/ /opt/keycloak/themes/

WORKDIR /

ENV PATH="/opt/keycloak/bin:${PATH}"

COPY --from=extension-builder /build/target/*.jar /opt/keycloak/providers
COPY ${DIR}/extensions/*.jar /opt/keycloak/providers

RUN kc.sh build --db=postgres

COPY ${DIR}/scripts/* ./
COPY ${DIR}/realms/* /import/
COPY ${DIR}/templates/* /templates/

EXPOSE 4000

COPY --chmod=0755 psa.utils.scripts/logs-masking/custom-entrypoint.sh /custom-entrypoint.sh
ENTRYPOINT ["/start.sh"]
