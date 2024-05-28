# PIA-System

![logo](psa.app.web/src/assets/images/pia_logo.png)

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![DOI](https://zenodo.org/badge/319654384.svg)](https://zenodo.org/badge/latestdoi/319654384)

[**P**rospective Mon**i**toring and Management - **A**pp](https://info-pia.de/) (PIA).

PIA facilitates the data acquisition in health studies and takes into account the wishes of the participants, the study center and the research institution and thereby also supports the long-term motivation of the participants.

PIA consists of a web application as well as mobile apps for Android and iOS that enables the participants to conduct health studies and study management, as well it can be used as a symptom diary for contact tracing.
The main goals of this project are:

- Simplify the data collection process
- (Long-term) motivation of users through persuasive technology
- Focus on usability and user centered design
- Focus on data protection and security

### Built with

In the backend PIA is composed of [Node.js](https://nodejs.org/) microservices that are using [PostgreSQL](https://www.postgresql.org/) as a database.
The microservices are containerized using [Docker](https://www.docker.com/) and deployed with [Kubernetes](https://kubernetes.io/).
As frontends an [Angular](https://angular.io/) web app and a [Ionic](https://ionicframework.com/) powered iOS and Android mobile app are provided.

## Getting started

### Local development

To set up PIA for local development, please follow the [development guide](./docs/development.md).

### Deployment

To deploy PIA to a (production) Kubernetes cluster, please follow the [deployment guide](./docs/deployment.md).

<!--
## Roadmap
*TODO*
-->

## Contributing

Any contributions you make are **greatly appreciated**.
Please fork the [gitlab repository](https://gitlab.com/pia-eresearch-system/pia).

1. Fork the [PIA GitLab repository](https://gitlab.com/pia-eresearch-system/pia)
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Make sure your Changes are formatted using [prettier](https://github.com/prettier/prettier) (`npx prettier --write .`)
4. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the Branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## Licence

Distributed under the AGPL-3.0 license. See [LICENSE](./LICENSES/AGPL-3.0-or-later.txt) for more information.

## Contact

[PiaPost@helmholtz-hzi.de](mailto:PiaPost@helmholtz-hzi.de)

![HZI](psa.app.web/src/assets/images/hzi_logo.jpg)
