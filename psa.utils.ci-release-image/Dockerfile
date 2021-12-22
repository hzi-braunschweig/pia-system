FROM docker:20.10.11@sha256:ff4fcc30e7c20f33c021e82683aedd1fe66654363eb1ff61065e0628f5bbf107 AS docker-binary

FROM registry.gitlab.com/gitlab-org/release-cli:v0.10.0@sha256:68e201226e1e76cb7edd327c89eb2d5d1a1d2b0fd4a6ea5126e24184d9aa4ffc AS release-cli-binary

FROM alpine:3.15.0@sha256:21a3deaa0d32a8057914f36584b5288d2e5ecc984380bc0118285c70fa8c9300 AS final
COPY --from=docker-binary /usr/local/bin/docker /usr/local/bin/docker
COPY --from=release-cli-binary /usr/local/bin/release-cli /usr/local/bin/release-cli
