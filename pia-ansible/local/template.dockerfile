FROM alpine:3.18.4@sha256:eece025e432126ce23f223450a0326fbebde39cdf496a85d8c016293fc851978 AS ansible

RUN apk add ansible

WORKDIR /data
RUN mkdir /data/generated

COPY local/ansible/* .

COPY roles/pia/templates/* templates/
COPY roles/pia/defaults/main.yml defaults.yml

RUN ansible-playbook -e @defaults.yml -e @extra-vars.yml playbook.yml

FROM scratch AS final

COPY --from=ansible /data/generated/ /
