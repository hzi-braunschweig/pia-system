# How to Build PIA Docker Images

PIA consists of several services which are packed into Docker images. These images are needed when deploying to a Kubernetes cluster.

You can build the images yourself and push them to your own Docker registry with [Bake](https://docs.docker.com/build/bake/). It is a command provided by Docker's BuildKit that allows for building multiple Docker images in a concurrent and cache-efficient manner.
It can be used to build all the Docker images required for PIA like this:

1. Checkout the tag of the desired PIA version from the `pia` Git repository
2. From the root folder execute the following command to build all images and push them to the registry:
   ```sh
   IMAGE_REGISTRY=your.docker.registry.url docker buildx bake deployment --push -f bake.hcl
   ```
   - The `--push` parameter will enable pushing the images to the registry
     - You need to be logged in to the registry before running the command
   - By setting the following environment variables, you can customize the build process:
     - `TAG`: Image version tag (default: `develop`)
     - `VERSION_INFO_PIPELINE_ID`: Pipeline ID which will be returned by the service's version info (default: `develop`)
     - `VERSION_INFO_GIT_HASH`: Git hash which will be returned by the service's version info
     - `VERSION_INFO_GIT_REF`: Git ref which will be returned by the service's version info
