FROM docker:20.10.12@sha256:a729cce205a05b0b86dc8dca87823efaffc3f74979fe7dc86a707c2fbf631b61 AS docker-binary

FROM registry.gitlab.com/gitlab-org/release-cli:v0.11.0@sha256:af74927a13c44668cf3741a8e3ef513cd4353703707c64b51b6f6ea98d3fefaf AS release-cli-binary

FROM alpine:3.15.0@sha256:21a3deaa0d32a8057914f36584b5288d2e5ecc984380bc0118285c70fa8c9300 AS final
COPY --from=docker-binary /usr/local/bin/docker /usr/local/bin/docker
COPY --from=release-cli-binary /usr/local/bin/release-cli /usr/local/bin/release-cli
