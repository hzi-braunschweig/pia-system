FROM docker:20.10.7@sha256:bfc499cef26daa22da31b76be1752813a6921ee1fa1dd1f56d4fdf19c701d332 AS docker-binary

FROM registry.gitlab.com/gitlab-org/release-cli:v0.8.0@sha256:cd1ebdca97e1a094bc0c1e9e0220eb3d4172e7049d5685c0af884f2eb06383c7 AS release-cli-binary

FROM alpine:3.14.0@sha256:234cb88d3020898631af0ccbbcca9a66ae7306ecd30c9720690858c1b007d2a0 AS final
COPY --from=docker-binary /usr/local/bin/docker /usr/local/bin/docker
COPY --from=release-cli-binary /usr/local/bin/release-cli /usr/local/bin/release-cli
