FROM regclient/regctl:v0.9.2@sha256:6e4dba784d54b82bc3556b47daac5b8af898c138e5024c628054715ccd4e2d2b AS regctl

FROM registry.gitlab.com/gitlab-org/release-cli:v0.24.0@sha256:3f52d526f48e8d10625c722fa6d6423ee82aadeae1b1aa91f07b62551d96dacf AS release-cli-binary

FROM debian:13.1@sha256:833c135acfe9521d7a0035a296076f98c182c542a2b6b5a0fd7063d355d696be AS final

RUN apt-get update && apt-get install -y skopeo ca-certificates jq

COPY --from=release-cli-binary /usr/local/bin/release-cli /usr/local/bin/release-cli
COPY --from=regctl /regctl /usr/local/bin/regctl
