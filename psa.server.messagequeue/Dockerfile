FROM rabbitmq:3.9.1@sha256:ab35a8f26964a4b1ae48ad39e775ce10f5d1018e8257896216b3d9e5455c72c4

RUN apt-get update && apt-get install -y gettext

RUN echo "[rabbitmq_management,rabbitmq_prometheus]." > /etc/rabbitmq/enabled_plugins
RUN echo "management_agent.disable_metrics_collector = false" > /etc/rabbitmq/conf.d/management_agent.disable_metrics_collector.conf
RUN echo "load_definitions = /etc/rabbitmq/definitions.json" > /etc/rabbitmq/conf.d/load_definitions.conf

ARG DIR=

COPY $DIR/definitions.json /etc/rabbitmq/definitions.json-template
COPY $DIR/start.sh /usr/local/bin/start.sh

ENTRYPOINT [ "/usr/local/bin/start.sh", "rabbitmq-server" ]
