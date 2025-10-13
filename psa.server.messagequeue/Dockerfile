FROM rabbitmq:3.9.29@sha256:ff02642ec7b0d1e23a2cf4172c2c1d4a82f39e7b79762414f0c1ac41618b8458

RUN apt-get update && apt-get install -y gettext

RUN echo "[rabbitmq_management,rabbitmq_prometheus]." > /etc/rabbitmq/enabled_plugins
RUN echo "management_agent.disable_metrics_collector = false" > /etc/rabbitmq/conf.d/management_agent.disable_metrics_collector.conf
RUN echo "load_definitions = /etc/rabbitmq/definitions.json" > /etc/rabbitmq/conf.d/load_definitions.conf

ARG DIR=

COPY $DIR/definitions.json /etc/rabbitmq/definitions.json-template
COPY $DIR/start.sh /usr/local/bin/start.sh

COPY --chmod=0755 psa.utils.scripts/logs-masking/custom-entrypoint.sh /custom-entrypoint.sh
ENTRYPOINT ["/custom-entrypoint.sh", "/usr/local/bin/start.sh", "rabbitmq-server"]