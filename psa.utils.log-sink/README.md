# psa.utils.log-sink

Log sink for PIA

## Overview

- This component is used for log collection from PIA system.
- Image from this Dockerfile is plain Fluentd image with addition of output plugin for Loki.
- This service should be deployed separately of PIA

## How to start this container

This service should be started by ansible role located [here](pia-ansible/roles/pia-fluentd)

## How it is used by PIA?

This container has to be deployed at that same platform as PIA. Then docker-compose.yml used to deploy PIA has to contain definition of logging driver for local instance of fluentd.

```yml
x-logging: &default-logging
  driver: 'fluentd'
  options:
    tag: 'pia.{{.Name}}'
    fluentd-async: 'true'

services:
  service1:
    logging: *default-logging
  service2:
    logging: *default-logging
```

Most important key here is fluentd-async. Setting this flag to true enables creating services even when fluentd is dead for some reason.

## Configurations

### Local file sink

![local-sink](doc/local-sink.drawio.svg 'Log flow for local file sink configuration')

### Loki redirect

![local-sink](doc/loki-sink.drawio.svg 'Log flow for Loki sink configuration')
