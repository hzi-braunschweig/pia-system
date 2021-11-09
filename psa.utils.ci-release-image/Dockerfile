FROM docker:20.10.9@sha256:938bcb85cf77db2b80d219abd5a1424ec15ce11a3adaea6423fa16cc9acfe926 AS docker-binary

FROM registry.gitlab.com/gitlab-org/release-cli:v0.10.0@sha256:68e201226e1e76cb7edd327c89eb2d5d1a1d2b0fd4a6ea5126e24184d9aa4ffc AS release-cli-binary

FROM alpine:3.14.2@sha256:e1c082e3d3c45cccac829840a25941e679c25d438cc8412c2fa221cf1a824e6a AS final
COPY --from=docker-binary /usr/local/bin/docker /usr/local/bin/docker
COPY --from=release-cli-binary /usr/local/bin/release-cli /usr/local/bin/release-cli
