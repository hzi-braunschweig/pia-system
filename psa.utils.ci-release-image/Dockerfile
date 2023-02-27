FROM registry.gitlab.com/gitlab-org/release-cli:v0.11.0@sha256:af74927a13c44668cf3741a8e3ef513cd4353703707c64b51b6f6ea98d3fefaf AS release-cli-binary

FROM quay.io/containers/skopeo:v1.10.0 AS final

COPY --from=release-cli-binary /usr/local/bin/release-cli /usr/local/bin/release-cli
