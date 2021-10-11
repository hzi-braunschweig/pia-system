# Setup instructions PIA on Debian 11

This guide helps with the setup of PIA on Debian 11.

PIA is using ansible for setup of different configurations in different host scenarios.
For example PIA can be setup as a distributed application with single parts on different hosts.

This guide is describing a single host solution where all parts of PIA are located on the same host.

_Access to a docker registry with the PIA images is required._

## Dependencies for the ansible host

On the ansible host we need ansible 2.10.8+ installed to execute the playbook.
The [pia-system](../) repository should be checked out in the same version that is to be installed on the PIA host.

## Dependencies for the PIA host

On the pia host we need the following packages installed:

```
apt-get install -y sudo python3 python3-cryptography python3-docker docker-compose docker.io
```

## Deployment user privileges on the PIA host

A user with passwordless `sudo` access is required on the PIA host.
_This user is only required for the deployment of PIA._
_PIA itself doesn't require that user._
_The access to that user account should be secured as any admin user account._

Example `/etc/sudoers` entry for the user `pia-deployer`:

```
pia-deployer	ALL=(ALL:ALL) NOPASSWD:ALL
```

### Deployment user without passwordless sudo

The deployment also works with a deployment user that has no passwordless sudo enabled.

Example `/etc/sudoers` entry for the user `pia-deployer`:

```
pia-deployer     ALL=(ALL:ALL) ALL
```

For that case the `--ask-become-pass` option has to be added to the `ansible-playbook` command.

## Adjust the example inventory

Adjust [example_single_host_inventory.yml](./example_single_host_inventory.yml) to your needs on the ansible host.

## Run ansible

To deploy PIA to the PIA host, run on the commandline of the ansible host in the [pia-system/pia-ansible](./) folder:

```
ansible-playbook --skip ansible-tower --skip installation -i example_single_host_inventory.yml playbook.yml
```

If you are not using ssh-keys (or any other automated authentication method), you have to add the `--ask-pass` to `ansible-playbook` to provide the login password for the deployment user.

## Check system

On the PIA system the docker containers should be up and healthy after some minutes.

This can be checked using `docker ps`.

PIA should now be reachable.

To add the first user follow the guide in [README.md](../README.md).
