FROM rabbitmq:3.9.7@sha256:00e803e20ee11328abf124314bab6d44e35ff926e4ca736c5cc24bb8e87f721b

RUN apt-get update && apt-get install -y gettext

RUN echo "[rabbitmq_management,rabbitmq_prometheus]." > /etc/rabbitmq/enabled_plugins
RUN echo "management_agent.disable_metrics_collector = false" > /etc/rabbitmq/conf.d/management_agent.disable_metrics_collector.conf
RUN echo "load_definitions = /etc/rabbitmq/definitions.json" > /etc/rabbitmq/conf.d/load_definitions.conf

ARG DIR=

COPY $DIR/definitions.json /etc/rabbitmq/definitions.json-template
COPY $DIR/start.sh /usr/local/bin/start.sh

ENTRYPOINT [ "/usr/local/bin/start.sh", "rabbitmq-server" ]
