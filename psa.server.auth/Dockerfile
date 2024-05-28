FROM maven:3.8.5-openjdk-17@sha256:62e6a9e10fb57f3019adeea481339c999930e7363f2468d1f51a7c0be4bca26d as extension-builder

ARG DIR=.

RUN mkdir /build
WORKDIR /build

COPY ${DIR}/extensions/keycloak-study-registration/ ./

RUN mvn clean package -Dmaven.test.skip=true

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
RUN curl -L -o ./keycloak-config-cli.jar https://github.com/adorsys/keycloak-config-cli/releases/download/v5.12.0/keycloak-config-cli-23.0.7.jar

################################################################

FROM quay.io/keycloak/keycloak:23.0.7@sha256:14e99d6f5dd0516a5bdc82537b732cb85469ecdb15ad7fe5f11ff67521544db8

ARG DIR=.

ENV KEYCLOAK_BACKEND_PORT 4000

COPY --from=dl-keycloak-config-cli /dl/keycloak-config-cli.jar /keycloak-config-cli.jar
COPY --from=theme-builder /build/themes/ /opt/keycloak/themes/

WORKDIR /

ENV PATH="/opt/keycloak/bin:${PATH}"

# check if the included themes have changed as we copied the themes
# language files to create our own custom language keys
RUN echo "11242fa4585d60e32a2280472c7b78db  /opt/keycloak/lib/lib/main/org.keycloak.keycloak-themes-23.0.7.jar" | md5sum -c


COPY --from=extension-builder /build/target/*.jar /opt/keycloak/providers
COPY ${DIR}/extensions/*.jar /opt/keycloak/providers

RUN kc.sh build --db=postgres

COPY ${DIR}/scripts/* ./
COPY ${DIR}/realms/* /import/
COPY ${DIR}/templates/* /templates/

EXPOSE 4000

COPY --chmod=0755 psa.utils.scripts/logs-masking/custom-entrypoint.sh /custom-entrypoint.sh
ENTRYPOINT ["/start.sh"]
