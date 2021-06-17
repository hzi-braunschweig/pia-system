# psa.utils.metrics

Metrics is reverse proxy. Metrics from PIA system should be available only from internal network of deployment and not be accessible from internet.
To provide this functionality reverse proxy based on Nginx was created.

## Features

### Reverse proxy for metrics

Metrics reverse proxy provides access to metrics endpoints of NodeJS services.
Any other endpoint returns 404.
To add additional metrics endpoint check ["How to update" section](#how-to-update)

#### Internal communication

Communication with PIA services inside internal docker network can be done via HTTPS.
Services certificates are used only for encryption, their verification is disabled (defalt Nginx behaviour).
For more information check ["Usage" section](#Usage)

#### External communication

Metrics are accessible at port 80 (redirection can be done via [docker-compose](pia-ansible/roles/pia/templates/docker-compose.yml.j2) and is setted to 9000).
For more information check ["Usage" section](#Usage)

### Security

Security is controlled via environment variables passed to container during it's creation.
Check ["Usage" section](#Usage)

## Limitations

Mutual usage of external HTTP and HTTPS is disabled.
Protocol can be selected via environment variable passed to container during it's creation.
Check ["Usage" section](#Usage)

## Usage

Behaviour of container can be controlled by passing environment variables during it's creation.

- INTERNAL_PROTOCOL (http|https)
  - This variable controls which protocol is used for communication with internal PIA services.
- METRICS_EXTERNAL_PROTOCOL (http|https)
  - This variable controls which protocol will be used for external access to metrics.
  - To use "https" is required to mount volume containing private key and certificate:
    - /ssl/metrics.cert;
    - /ssl/metrics.key;
- METRICS_ENABLED_FOR (qpia|ipia|ewpia|all)
  - This variable controls which template is used for nginx configuration
  - Values "qpia|ipia|ewpia" selects corresponding template
  - Value "all" merges all templates in one

## How to update

To add/remove metrics endpoint please modify:

- [QPIA endpoints](psa.utils.metrics/rootfs-overlay/etc/nginx/templates/metrics-qpia.template)
- [IPIA endpoints](psa.utils.metrics/rootfs-overlay/etc/nginx/templates/metrics-ipia.template)
- [EWPIA endpoints](psa.utils.metrics/rootfs-overlay/etc/nginx/templates/metrics-ewpia.template)
