FROM centos:centos7.8.2003
RUN yum-config-manager --add-repo https://releases.ansible.com/ansible-tower/cli/ansible-tower-cli-el7.repo
RUN yum update -y && \
    yum install --nogpgcheck ansible-tower-cli -y && \
    yum clean all -y
CMD ["awx", "--help"]
