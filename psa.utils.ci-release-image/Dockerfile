FROM regclient/regctl:v0.5.4@sha256:f88a8e55da3ff1fc53284f7f9643dd814244536812158fba0483472501c6c5e7 AS regctl

FROM registry.gitlab.com/gitlab-org/release-cli:v0.16.0@sha256:5a71acbadc47c1971100f5246b09f88ba09e84ebe7769e425475dce85245a2bf AS release-cli-binary

FROM debian:12.2@sha256:22cc4de537485807b7efe6f4c942d7460c4482852f49434f9c022c044c545a90 AS final

RUN apt-get update && apt-get install -y skopeo ca-certificates jq

COPY --from=release-cli-binary /usr/local/bin/release-cli /usr/local/bin/release-cli
COPY --from=regctl /regctl /usr/local/bin/regctl
