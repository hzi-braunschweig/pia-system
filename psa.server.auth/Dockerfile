FROM maven:3.9.11-amazoncorretto-21-debian@sha256:55d0fa0ef06c61796456993b196c5790bd8c5c97642d12a959a7c750fe46e65a AS extension-builder

ARG DIR=.

RUN mkdir /build
WORKDIR /build

COPY ${DIR}/extensions/keycloak-study-registration/ ./keycloak-study-registration
COPY ${DIR}/extensions/account-ui-theme/ ./account-ui-theme

RUN --mount=type=cache,target=/root/.m2 \
    cd keycloak-study-registration && mvn clean package -Dmaven.test.skip=true
RUN --mount=type=cache,target=/root/.m2 \
    cd account-ui-theme && mvn clean package -Dmaven.test.skip=true


################################################################

FROM node:20.18.1-alpine@sha256:24fb6aa7020d9a20b00d6da6d1714187c45ed00d1eb4adb01395843c338b9372 AS theme-builder

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

FROM curlimages/curl@sha256:463eaf6072688fe96ac64fa623fe73e1dbe25d8ad6c34404a669ad3ce1f104b6 AS dl-keycloak-config-cli

WORKDIR /dl
RUN curl -L -o ./keycloak-config-cli.jar https://github.com/adorsys/keycloak-config-cli/releases/download/v6.4.0/keycloak-config-cli-26.1.0.jar

################################################################

FROM quay.io/keycloak/keycloak:26.3.4@sha256:2b32a51a31e8d780d9fa9a69a59ead69975263c61b5dd13559090e22aa26f100

ARG DIR=.

ENV KEYCLOAK_BACKEND_PORT=4000

COPY --from=dl-keycloak-config-cli /dl/keycloak-config-cli.jar /keycloak-config-cli.jar
COPY --from=theme-builder /build/themes/ /opt/keycloak/themes/

WORKDIR /

ENV PATH="/opt/keycloak/bin:${PATH}"

COPY --from=extension-builder /build/keycloak-study-registration/target/*.jar /opt/keycloak/providers
COPY --from=extension-builder /build/account-ui-theme/target/*.jar /opt/keycloak/providers
COPY ${DIR}/extensions/*.jar /opt/keycloak/providers

RUN kc.sh build --db=postgres

COPY ${DIR}/scripts/* ./
COPY ${DIR}/realms/* /import/
COPY ${DIR}/templates/* /templates/

EXPOSE 4000

ENV EMAIL_THEME=pia
COPY --chmod=0755 psa.utils.scripts/logs-masking/custom-entrypoint.sh /custom-entrypoint.sh
ENTRYPOINT ["/start.sh"]
