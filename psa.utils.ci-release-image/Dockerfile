FROM docker:20.10.8@sha256:63107bd6ce718f130bb2668704239467b74f034c446f9e9c4ae1ffa5ddf4e3dd AS docker-binary

FROM registry.gitlab.com/gitlab-org/release-cli:v0.10.0@sha256:68e201226e1e76cb7edd327c89eb2d5d1a1d2b0fd4a6ea5126e24184d9aa4ffc AS release-cli-binary

FROM alpine:3.14.2@sha256:e1c082e3d3c45cccac829840a25941e679c25d438cc8412c2fa221cf1a824e6a AS final
COPY --from=docker-binary /usr/local/bin/docker /usr/local/bin/docker
COPY --from=release-cli-binary /usr/local/bin/release-cli /usr/local/bin/release-cli
