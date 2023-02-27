FROM maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215 as extension-builder

ARG DIR=.

RUN mkdir /build
WORKDIR /build

COPY ${DIR}/extensions/keycloak-study-registration/ ./

RUN mvn clean package -Dmaven.test.skip=true

################################################################

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
RUN curl -L -o ./keycloak-config-cli.jar https://github.com/adorsys/keycloak-config-cli/releases/download/v5.3.1/keycloak-config-cli-19.0.1.jar

################################################################

FROM quay.io/keycloak/keycloak:19.0.1@sha256:fb6be1665f2939ca123b5fee0d6d8e06a3d99ba1e5224b5b1cf0eb48168f1ef6

ARG DIR=.

ENV KEYCLOAK_BACKEND_PORT 4000

COPY --from=dl-keycloak-config-cli /dl/keycloak-config-cli.jar /keycloak-config-cli.jar
COPY --from=theme-builder /build/themes/ /opt/keycloak/themes/

WORKDIR /

ENV PATH="/opt/keycloak/bin:${PATH}"

# check that the start file is present in the image
# so that we get an build error if something essential has changed
RUN echo "e8df29daf195842156b3473088cec350  /opt/keycloak/bin/kc.sh" | md5sum -c

# check if the included themes have changed as we copied the themes
# language files to create our own custom language keys
RUN echo "9349ef4a1a231bf36c2dbf110fe6a1eb  /opt/keycloak/lib/lib/main/org.keycloak.keycloak-themes-19.0.1.jar" | md5sum -c

COPY --from=extension-builder /build/target/*.jar /opt/keycloak/providers
COPY ${DIR}/extensions/*.jar /opt/keycloak/providers

RUN kc.sh build --db=postgres

COPY ${DIR}/scripts/* ./
COPY ${DIR}/realms/* /import/
COPY ${DIR}/templates/* /templates/

EXPOSE 4000

ENTRYPOINT [ "/start.sh" ]
