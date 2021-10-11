FROM alpine:3.14.2@sha256:e1c082e3d3c45cccac829840a25941e679c25d438cc8412c2fa221cf1a824e6a AS ansible

RUN apk add ansible

WORKDIR /data
RUN mkdir /data/generated

COPY local/ansible/* .

COPY roles/pia/templates/* templates/
COPY roles/pia/defaults/main.yml defaults.yml

RUN ansible-playbook -e @defaults.yml -e @extra-vars.yml playbook.yml

FROM scratch AS final

COPY --from=ansible /data/generated/ /
