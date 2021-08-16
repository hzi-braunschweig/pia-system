FROM alpine:3.14.0@sha256:adab3844f497ab9171f070d4cae4114b5aec565ac772e2f2579405b78be67c96 AS ansible

RUN apk add ansible

WORKDIR /data
RUN mkdir /data/generated

COPY local/ansible/* .

COPY roles/pia/templates/* templates/
COPY roles/pia/defaults/main.yml defaults.yml

RUN ansible-playbook -e @defaults.yml -e @extra-vars.yml playbook.yml

FROM scratch AS final

COPY --from=ansible /data/generated/ /
