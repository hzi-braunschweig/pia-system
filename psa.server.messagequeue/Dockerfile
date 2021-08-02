FROM rabbitmq:3.8.19@sha256:8ab8da1c463bafd02d14a081f8f7634f2de27744fd45c5be31769fdc7e60d236

RUN apt-get update && apt-get install -y gettext

RUN echo "[rabbitmq_management,rabbitmq_prometheus]." > /etc/rabbitmq/enabled_plugins
RUN echo "management_agent.disable_metrics_collector = false" > /etc/rabbitmq/conf.d/management_agent.disable_metrics_collector.conf

ARG DIR=

COPY $DIR/definitions.json /etc/rabbitmq/definitions.json-template
COPY $DIR/start.sh /usr/local/bin/start.sh

ENTRYPOINT [ "/usr/local/bin/start.sh", "rabbitmq-server" ]
