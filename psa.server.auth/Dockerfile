FROM node:14.19.0-alpine@sha256:9a2aa545388a135b496bd55cef2be920b96c4526c99c140170e05a8de3fce653 as theme-builder

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

FROM curlimages/curl@sha256:faaba66e89c87fd3fb51336857142ee6ce78fa8d8f023a5713d2bf4957f1aca8 AS dl-keycloak-config-cli

WORKDIR /dl
RUN curl -L -o ./keycloak-config-cli.jar https://github.com/adorsys/keycloak-config-cli/releases/download/v4.5.0/keycloak-config-cli-16.0.0.jar

################################################################

FROM quay.io/keycloak/keycloak-x:16.1.1@sha256:2338a5c40c2bd25e83799fcbbad4b801734d2daf0c58f877654de828bde16293

ARG DIR=.

ENV KEYCLOAK_BACKEND_PORT 4000

COPY --from=dl-keycloak-config-cli /dl/keycloak-config-cli.jar /keycloak-config-cli.jar
COPY --from=theme-builder /build/themes/ /opt/keycloak/themes/

WORKDIR /

ENV PATH="/opt/keycloak/bin:${PATH}"

# check that the start file is present in the image
# so that we get an build error if something essential has changed
RUN echo "205694b9643aeabf7aaa700b2893c9f3  /opt/keycloak/bin/kc.sh" | md5sum -c

# check if the included themes have changed as we copied the themes
# language files to create our own custom language keys
RUN echo "90e3b7b569c8f1a0c5bab5153d5ec1f7  /opt/keycloak/lib/lib/main/org.keycloak.keycloak-themes-16.1.1.jar" | md5sum -c

COPY ${DIR}/extensions/* /opt/keycloak/providers

RUN kc.sh build --db=postgres

COPY ${DIR}/scripts/* ./
COPY ${DIR}/realms/* /import/
COPY ${DIR}/templates/* /templates/

EXPOSE 4000

ENTRYPOINT [ "/start.sh" ]
