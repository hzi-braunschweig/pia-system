FROM centos:centos7.8.2003@sha256:8540a199ad51c6b7b51492fa9fee27549fd11b3bb913e888ab2ccf77cbb72cc1
RUN yum-config-manager --add-repo https://releases.ansible.com/ansible-tower/cli/ansible-tower-cli-el7.repo
RUN yum update -y && \
    yum install --nogpgcheck ansible-tower-cli -y && \
    yum clean all -y
CMD ["awx", "--help"]
