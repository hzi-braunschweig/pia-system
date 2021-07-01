FROM alpine:3.14.0@sha256:234cb88d3020898631af0ccbbcca9a66ae7306ecd30c9720690858c1b007d2a0 AS ansible

RUN apk add ansible

WORKDIR /data
RUN mkdir /data/generated

COPY local/ansible/* .

COPY roles/pia/templates/* templates/
COPY roles/pia/defaults/main.yml defaults.yml

RUN ansible-playbook -e @defaults.yml -e @extra-vars.yml playbook.yml

FROM scratch AS final

COPY --from=ansible /data/generated/ /
