# Deployment

## Prerequisites

To allow for a high degree of flexibility, PIA is designed to be deployed to a Kubernetes cluster.
This allows you to run PIA using a cloud provider, on-premises, or locally in the same way.

For the deployment, we assume that you meet the following requirements:

- You have an [existing Kubernetes cluster](https://kubernetes.io/docs/setup/)
  - A **namespace** for PIA exists in this cluster for which you have deployment rights
  - Please note that by default at least **8 CPU cores** and **8 GB of RAM** will be requested (not necessarily used) by PIA (can be overwritten via a `kustomization.yaml`)
  - Although not strictly required, it is highly recommended to install a service mesh to [secure network traffic inside your cluster](#securing-internal-network-traffic)
- You have [Docker](https://www.docker.com/) and [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) installed on your deployment machine
- You have a basic understanding of managing Kubernetes configuration with [Kustomize](https://kustomize.io/)
- You have access to a registry containing the PIA Docker images (see [Docker Images](#docker-images))

> ℹ️ Although PIA is designed to be deployed to a Kubernetes cluster, it is currently not recommended to scale PIA horizontally. This is due to the fact that PIA is not yet fully stateless and therefore not yet able to handle multiple instances of the same service. We are working on making PIA stateless and horizontally scalable in the future.

### Docker Images

PIA consists of Docker images which are built and pushed to a Docker registry. Due to [certain legal restrictions](https://www.linuxfoundation.org/resources/publications/docker-containers-what-are-the-open-source-licensing-considerations),
we are currently not able to provide these images in a public Docker registry.

At the time of writing, **you have to build the images yourself and push them to your own Docker registry**.

However, we prepared [instructions on how to build and push the Docker images yourself](./build-docker-images.md) to make this as easy as possible.
After you followed the instructions make sure to correctly **point your deployment configuration** to your Docker registry (see third step of [Preparation](#preparation)).

### Securing External Network Traffic

PIA uses the Kubernetes Ingress to expose its UI and APIs to the public. We highly recommend using a TLS certificate to secure the external network traffic.
The default configuration of PIA expects a Secret with name `ingress-tls` which holds the TLS certificate.
This can be configured in the `kustomization.yaml` of your deployment configuration (see [Preparation](#preparation)).

Please check the official [Kubernetes Ingress documentation](https://kubernetes.io/docs/concepts/services-networking/ingress/#tls) to learn more about how to configure TLS.

> ⚠️ If you are using an additional reverse proxy in front of PIA, **please ensure it is correctly setting `X-Forwarded-For`, `X-Forwarded-Proto`, and `X-Forwarded-Host` HTTP headers.**

### Securing Internal Network Traffic

PIA is prepared to run in a Kubernetes cluster with [Linkerd](https://linkerd.io/) as a service mesh. We highly recommend using a service mesh to secure internal network traffic between the internal services and databases.
Please follow the official [Linkerd installation guide](https://linkerd.io/2/getting-started/) to install Linkerd in your Kubernetes cluster.

> ⚠️ If you are not using a service mesh, network traffic between the services and databases is not encrypted and can potentially be intercepted by other services in the same cluster.

## Preparation

The deployment configuration of PIA is managed via [Kustomize](https://kustomize.io/). This allows you to customize PIA in a flexible way.
You will create an overlay which contains the specific configuration for your environment.

The following steps will guide you through the deployment preparation. This is **only necessary for the first deployment**.
Execute all commands on your deployment machine.

1. Checkout the tag of the desired PIA version from the `pia` Git repository
2. Create a new directory for your deployment configuration in `k8s/deployment/overlays/` (while replacing `<your-deployment-name>` with the name of your deployment directory):

   ```sh
   mkdir ./k8s/deployment/overlays/<your-deployment-name>
   ```

3. Create a `kustomization.yaml` in the newly created directory by executing the following script and entering the requested configuration values (while replacing `<your-deployment-name>` with the name of your deployment directory):

   ```sh
   ./k8s/utils/create-overlay.sh ./k8s/deployment/overlays/<your-deployment-name>
   ```

   - Please check the [complete list of all configuration options](./configuration.md) to get more information about what you can configure

   > ℹ️ This script **will only run in bash-like environments (e.g. Linux, macOS, WSL)**. Alternatively you can copy the
   > contents from `./k8s/utils/overlay-template.yaml` and manually replace the placeholders with actual configuration values.

4. In the newly created directory, create a `.dockerconfigjson` file with the following structure and replace the placeholders with the secrets for your Docker registry:

   ```json
   {
     "auths": {
       "your.docker.registry.url": {
         "username": "your-username",
         "password": "your-password"
       }
     }
   }
   ```

5. Create mandatory internal secrets for your deployment by running the following command from the `k8s` directory (while replacing `<your-deployment-name>` with the name of your deployment directory):

   - Execute locally (faster, but requires [Node.js](https://nodejs.org/) installed on your machine):
     ```sh
     npm ci && npm run --silent generate-internal-secrets > deployment/overlays/<your-deployment-name>/internal-secrets.yaml
     ```
   - Execute in Docker (slower, but no Node.js required):
     ```sh
     docker run <your.docker.registry.url>/k8s:<your-tag> generate-internal-secrets > deployment/overlays/<your-deployment-name>/internal-secrets.yaml
     ```

   > ⚠️ The generated `internal-secrets.yaml` file **contains secrets which must not be shared** with others. Please make sure to **store and handle those secrets with care**!

Now your deployment configuration is ready to be deployed 🎉

## Customizing header logo

> ⚠️ The logo file must be a JPEG image with a maximum size of 100 KB. Keep it as small as possible.

If you did not specify a logo file during creating your custom overlay, you can add the necessary configuration and files manually:

1. Name your logo file `logo.jpeg` and copy it to `k8s/deployment/overlays/<your-deployment-name>`.
2. Create a compressed version: `gzip < logo.jpeg > logo.jpeg.gz`
3. Add the following configuration to your overlays `kustomization.yaml` file:

   ```yaml
   components:
     - ../../components/customize-logo

   configMapGenerator:
     - name: pia-logo
       files:
         - ./logo.jpeg
         - ./logo.jpeg.gz
   ```

## Deploying

Deploy PIA to your cluster by running the following command from the `k8s` directory (while replacing `<your-deployment-name>` with the name of your deployment directory):

```sh
kubectl apply -n <your-namespace> -k deployment/overlays/<your-deployment-name>
```

After all services are up and running, you can access:

- **PIA Admin UI** at `<your-base-url>/admin/`
  - For the first login, you need to create a SysAdmin (see [Creating the First User](create-first-user.md))
- **PIA Participant UI** at `<your-base-url>`

## Updating

Whenever you want to **update your PIA instance**, please first check our [distribution notes](../DISTRIBUTION_NOTES.md) for any changes.
If there are any relevant changes for your setup, please adapt your deployment configuration accordingly.

To do the actual update checkout the desired version tag (e.g. `1.36.0`) from the Git repository and simply run the `kubectl apply` command again.
The Kubernetes manifest will contain the version of the corresponding Git tag. This way it is guaranteed that the Kubernetes manifest and the Docker images are in sync.
