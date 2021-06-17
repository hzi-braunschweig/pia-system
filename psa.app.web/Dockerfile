# Stage 1: Build an Angular Docker Image
FROM node:14.17.0-alpine@sha256:f07ead757c93bc5e9e79978075217851d45a5d8e5c48eaf823e7f12d9bbc1d3c AS build

USER node
WORKDIR /app

ARG DIR=.
ENV CYPRESS_INSTALL_BINARY=0
ENV PACT_SKIP_BINARY_INSTALL=true
COPY $DIR/package*.json ./
RUN npm ci

COPY $DIR/*.json ./
COPY $DIR/licenses ./licenses
COPY $DIR/src ./src
ARG configuration=production
ARG nodeoptions
ENV NODE_OPTIONS=$nodeoptions
RUN npm run build -- --outputPath=./dist/out --configuration $configuration

# create the pre-compressed gzip files for faster serving
RUN find /app/dist/out/ | xargs gzip -k -9

# Stage 2, use the compiled app, ready for production with Nginx
FROM nginx:1.21.0-alpine@sha256:0f8595aa040ec107821e0409a1dd3f7a5e989501d5c8d5b5ca1f955f33ac81a0 AS final

ARG DIR=.

RUN rm -rf /usr/share/nginx/html/*
ENV WEBAPPSERVER_HTTP_PORT=80 WEBAPPSERVER_HTTPS_PORT=443 DEFAULT_LANGUAGE=en-US
COPY $DIR/envsubst-on-environment.sh /docker-entrypoint.d/40-envsubst-on-environment.sh
COPY $DIR/nginx-site.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/out/ /usr/share/nginx/html
COPY --from=build /app/dist/out/main*.js /usr/share/nginx/template/main.js.template

ARG VERSION_INFO_PIPELINE_ID=-
ENV VERSION_INFO_PIPELINE_ID=$VERSION_INFO_PIPELINE_ID

ARG VERSION_INFO_GIT_HASH=-
ENV VERSION_INFO_GIT_HASH=$VERSION_INFO_GIT_HASH

ARG VERSION_INFO_GIT_REF=-
ENV VERSION_INFO_GIT_REF=$VERSION_INFO_GIT_REF

RUN echo "{\"PIPELINE_ID\":\"$VERSION_INFO_PIPELINE_ID\",\"GIT_HASH\":\"$VERSION_INFO_GIT_HASH\",\"GIT_REF\":\"$VERSION_INFO_GIT_REF\"}" > /usr/share/nginx/html/version

HEALTHCHECK CMD curl -k https://localhost:$WEBAPPSERVER_HTTPS_PORT
