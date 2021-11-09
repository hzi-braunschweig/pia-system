FROM rabbitmq:3.9.8@sha256:757abf009946cbd85bef134bb54a43a36078a9b907307f05e89e80a0f8fed401

RUN apt-get update && apt-get install -y gettext

RUN echo "[rabbitmq_management,rabbitmq_prometheus]." > /etc/rabbitmq/enabled_plugins
RUN echo "management_agent.disable_metrics_collector = false" > /etc/rabbitmq/conf.d/management_agent.disable_metrics_collector.conf
RUN echo "load_definitions = /etc/rabbitmq/definitions.json" > /etc/rabbitmq/conf.d/load_definitions.conf

ARG DIR=

COPY $DIR/definitions.json /etc/rabbitmq/definitions.json-template
COPY $DIR/start.sh /usr/local/bin/start.sh

ENTRYPOINT [ "/usr/local/bin/start.sh", "rabbitmq-server" ]
