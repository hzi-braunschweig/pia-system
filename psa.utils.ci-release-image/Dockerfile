FROM docker:20.10.7@sha256:7a49f42626fed01146792e5add6e48e2c9f1eb3550a6840356757e55cc36ba25 AS docker-binary

FROM registry.gitlab.com/gitlab-org/release-cli:v0.8.0@sha256:419c4f61ecc172880d6ed60169c02c62763b6f2abeb8c505c77c2f80d88c59fe AS release-cli-binary

FROM alpine:3.13.5@sha256:69e70a79f2d41ab5d637de98c1e0b055206ba40a8145e7bddb55ccc04e13cf8f AS final
COPY --from=docker-binary /usr/local/bin/docker /usr/local/bin/docker
COPY --from=release-cli-binary /usr/local/bin/release-cli /usr/local/bin/release-cli
