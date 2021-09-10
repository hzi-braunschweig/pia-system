FROM alpine:3.14.1@sha256:eb3e4e175ba6d212ba1d6e04fc0782916c08e1c9d7b45892e9796141b1d379ae AS ansible

RUN apk add ansible

WORKDIR /data
RUN mkdir /data/generated

COPY local/ansible/* .

COPY roles/pia/templates/* templates/
COPY roles/pia/defaults/main.yml defaults.yml

RUN ansible-playbook -e @defaults.yml -e @extra-vars.yml playbook.yml

FROM scratch AS final

COPY --from=ansible /data/generated/ /
