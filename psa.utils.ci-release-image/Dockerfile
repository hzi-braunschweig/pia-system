FROM docker:20.10.8@sha256:ddf0d732dcbc3e2087836e06e50cc97e21bfb002a49c7d0fe767f6c31e01d65f AS docker-binary

FROM registry.gitlab.com/gitlab-org/release-cli:v0.9.0@sha256:4314166ce30da0166c9a9a86aeb070b6a152070340b03a51cf00411d6b068299 AS release-cli-binary

FROM alpine:3.14.1@sha256:eb3e4e175ba6d212ba1d6e04fc0782916c08e1c9d7b45892e9796141b1d379ae AS final
COPY --from=docker-binary /usr/local/bin/docker /usr/local/bin/docker
COPY --from=release-cli-binary /usr/local/bin/release-cli /usr/local/bin/release-cli
