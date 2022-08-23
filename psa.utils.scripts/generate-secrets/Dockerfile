FROM alpine:3.15.0@sha256:21a3deaa0d32a8057914f36584b5288d2e5ecc984380bc0118285c70fa8c9300 AS openssl
RUN apk add openssl

FROM openssl AS certs
WORKDIR /data/
ARG CA_KEY_SIZE=4096
ENV CA_KEY_SIZE=$CA_KEY_SIZE
ARG SERVICE_KEY_SIZE=4096
ENV SERVICE_KEY_SIZE=$SERVICE_KEY_SIZE
ARG CA_VALIDITY_DAYS=365
ENV CA_VALIDITY_DAYS=$CA_VALIDITY_DAYS
ARG SERVICE_VALIDITY_DAYS=365
ENV SERVICE_VALIDITY_DAYS=$SERVICE_VALIDITY_DAYS

RUN openssl genrsa -out ca-key.pem $CA_KEY_SIZE
RUN openssl req -x509 -new -nodes -extensions v3_ca -key ca-key.pem -days $CA_VALIDITY_DAYS -out ca.cert -sha512 -subj "/CN=pia-root"

RUN echo '#!/bin/sh' > create_cert.sh
RUN echo 'echo "subjectAltName=DNS:$CN,DNS:localhost,DNS:pia-app" > /etc/ssl/san.cnf' >> create_cert.sh
RUN echo 'openssl genrsa -out $FILE_NAME.key $SERVICE_KEY_SIZE' >> create_cert.sh
RUN echo 'openssl req -new -key $FILE_NAME.key -out $FILE_NAME.csr -sha512 -subj "/CN=$CN"' >> create_cert.sh
RUN echo 'openssl x509 -req -in $FILE_NAME.csr -CA ca.cert -CAkey ca-key.pem -CAcreateserial -out $FILE_NAME.cert -days $SERVICE_VALIDITY_DAYS -sha512 -extfile /etc/ssl/san.cnf' >> create_cert.sh
RUN echo 'mkdir $CN' >> create_cert.sh
RUN echo 'cp ca.cert $FILE_NAME.key $FILE_NAME.cert $CN/' >> create_cert.sh
RUN chmod +x create_cert.sh

RUN FILE_NAME=qpia CN=databaseservice ./create_cert.sh
RUN FILE_NAME=ipia CN=ipiaservice ./create_cert.sh
RUN FILE_NAME=ewpia CN=ewpiaservice ./create_cert.sh
RUN FILE_NAME=cs CN=complianceservice ./create_cert.sh
RUN FILE_NAME=pe CN=personaldataservice ./create_cert.sh
RUN FILE_NAME=so CN=sormasservice ./create_cert.sh
RUN FILE_NAME=an CN=analyzerservice ./create_cert.sh
RUN FILE_NAME=us CN=userservice ./create_cert.sh
RUN FILE_NAME=web CN=webappserver ./create_cert.sh
RUN FILE_NAME=qu CN=questionnaireservice ./create_cert.sh
RUN FILE_NAME=lo CN=loggingservice ./create_cert.sh
RUN FILE_NAME=sa CN=sampletrackingservice ./create_cert.sh
RUN FILE_NAME=modys CN=modysservice ./create_cert.sh
RUN FILE_NAME=lh CN=localhost ./create_cert.sh
RUN FILE_NAME=no CN=notificationservice ./create_cert.sh
RUN FILE_NAME=metrics CN=metricsproxy ./create_cert.sh
RUN FILE_NAME=api CN=apigateway ./create_cert.sh
RUN FILE_NAME=authserver CN=authserver ./create_cert.sh
RUN FILE_NAME=aep CN=autheventproxy ./create_cert.sh

# create chain certificate for web
RUN cat web.cert ca.cert > chain.cert

RUN rm *.csr ca-key.pem create_cert.sh

RUN find .

FROM openssl AS firebase
WORKDIR /data/
RUN openssl genrsa -out dummy.key 512
RUN echo -n '{"project_id":"dummy","private_key":"' > credential.json
RUN cat dummy.key | tr '\n' '!' | sed 's/!/\\n/g' >> credential.json
RUN echo -n '","client_email":"dummy"}' >> credential.json
RUN rm dummy.key

FROM scratch AS final
WORKDIR /
COPY --from=certs /data/ ssl/
COPY --from=firebase /data/ firebase/
