FROM rabbitmq:3.8.17@sha256:02a9baba56dc6065a64c76330f75d5b5722258c67e94371853bf29728713f686

RUN apt-get update && apt-get install -y gettext

RUN echo "[rabbitmq_management,rabbitmq_prometheus]." > /etc/rabbitmq/enabled_plugins
RUN echo "management_agent.disable_metrics_collector = false" > /etc/rabbitmq/conf.d/management_agent.disable_metrics_collector.conf

ARG DIR=

COPY $DIR/definitions.json /etc/rabbitmq/definitions.json-template
COPY $DIR/start.sh /usr/local/bin/start.sh

ENTRYPOINT [ "/usr/local/bin/start.sh", "rabbitmq-server" ]
