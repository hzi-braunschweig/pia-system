FROM registry.gitlab.com/gitlab-org/release-cli:v0.11.0@sha256:af74927a13c44668cf3741a8e3ef513cd4353703707c64b51b6f6ea98d3fefaf AS release-cli-binary

FROM debian:12.1@sha256:a60c0c42bc6bdc09d91cd57067fcc952b68ad62de651c4cf939c27c9f007d1c5 AS final

RUN apt-get update && apt-get install -y skopeo ca-certificates

COPY --from=release-cli-binary /usr/local/bin/release-cli /usr/local/bin/release-cli
