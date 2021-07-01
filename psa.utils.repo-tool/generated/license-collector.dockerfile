ARG VERSION=

# it is (currently) not possible to use a variable inside the mount of a RUN.
FROM registry.netzlink.com/pia/psa.app.mobile-npm-install:${VERSION} as psa.app.mobile-npm-install
FROM registry.netzlink.com/pia/psa.app.web-npm-install:${VERSION} as psa.app.web-npm-install
FROM registry.netzlink.com/pia/psa.lib.messagequeue-npm-install:${VERSION} as psa.lib.messagequeue-npm-install
FROM registry.netzlink.com/pia/psa.lib.service-core-npm-install:${VERSION} as psa.lib.service-core-npm-install
FROM registry.netzlink.com/pia/psa.lib.templatepipeline-npm-install:${VERSION} as psa.lib.templatepipeline-npm-install
FROM registry.netzlink.com/pia/psa.server.apigateway-npm-install:${VERSION} as psa.server.apigateway-npm-install
FROM registry.netzlink.com/pia/psa.service.analyzerservice-npm-install:${VERSION} as psa.service.analyzerservice-npm-install
FROM registry.netzlink.com/pia/psa.service.authservice-npm-install:${VERSION} as psa.service.authservice-npm-install
FROM registry.netzlink.com/pia/psa.service.complianceservice-npm-install:${VERSION} as psa.service.complianceservice-npm-install
FROM registry.netzlink.com/pia/psa.service.loggingservice-npm-install:${VERSION} as psa.service.loggingservice-npm-install
FROM registry.netzlink.com/pia/psa.service.modysservice-npm-install:${VERSION} as psa.service.modysservice-npm-install
FROM registry.netzlink.com/pia/psa.service.notificationservice-npm-install:${VERSION} as psa.service.notificationservice-npm-install
FROM registry.netzlink.com/pia/psa.service.personaldataservice-npm-install:${VERSION} as psa.service.personaldataservice-npm-install
FROM registry.netzlink.com/pia/psa.service.questionnaireservice-npm-install:${VERSION} as psa.service.questionnaireservice-npm-install
FROM registry.netzlink.com/pia/psa.service.sampletrackingservice-npm-install:${VERSION} as psa.service.sampletrackingservice-npm-install
FROM registry.netzlink.com/pia/psa.service.sormasservice-npm-install:${VERSION} as psa.service.sormasservice-npm-install
FROM registry.netzlink.com/pia/psa.service.userservice-npm-install:${VERSION} as psa.service.userservice-npm-install
FROM registry.netzlink.com/pia/psa.utils.deploymentservice-npm-install:${VERSION} as psa.utils.deploymentservice-npm-install
FROM registry.netzlink.com/pia/psa.utils.repo-tool-npm-install:${VERSION} as psa.utils.repo-tool-npm-install

FROM registry.netzlink.com/pia/psa.utils.repo-tool:${VERSION} AS base

RUN \
	--mount=type=bind,ro,from=psa.app.mobile-npm-install,source=/dependencies/psa.app.mobile,target=/dependencies/psa.app.mobile \
	--mount=type=bind,ro,from=psa.app.web-npm-install,source=/dependencies/psa.app.web,target=/dependencies/psa.app.web \
	--mount=type=bind,ro,from=psa.lib.messagequeue-npm-install,source=/dependencies/psa.lib.messagequeue,target=/dependencies/psa.lib.messagequeue \
	--mount=type=bind,ro,from=psa.lib.service-core-npm-install,source=/dependencies/psa.lib.service-core,target=/dependencies/psa.lib.service-core \
	--mount=type=bind,ro,from=psa.lib.templatepipeline-npm-install,source=/dependencies/psa.lib.templatepipeline,target=/dependencies/psa.lib.templatepipeline \
	--mount=type=bind,ro,from=psa.server.apigateway-npm-install,source=/dependencies/psa.server.apigateway,target=/dependencies/psa.server.apigateway \
	--mount=type=bind,ro,from=psa.service.analyzerservice-npm-install,source=/dependencies/psa.service.analyzerservice,target=/dependencies/psa.service.analyzerservice \
	--mount=type=bind,ro,from=psa.service.authservice-npm-install,source=/dependencies/psa.service.authservice,target=/dependencies/psa.service.authservice \
	--mount=type=bind,ro,from=psa.service.complianceservice-npm-install,source=/dependencies/psa.service.complianceservice,target=/dependencies/psa.service.complianceservice \
	--mount=type=bind,ro,from=psa.service.loggingservice-npm-install,source=/dependencies/psa.service.loggingservice,target=/dependencies/psa.service.loggingservice \
	--mount=type=bind,ro,from=psa.service.modysservice-npm-install,source=/dependencies/psa.service.modysservice,target=/dependencies/psa.service.modysservice \
	--mount=type=bind,ro,from=psa.service.notificationservice-npm-install,source=/dependencies/psa.service.notificationservice,target=/dependencies/psa.service.notificationservice \
	--mount=type=bind,ro,from=psa.service.personaldataservice-npm-install,source=/dependencies/psa.service.personaldataservice,target=/dependencies/psa.service.personaldataservice \
	--mount=type=bind,ro,from=psa.service.questionnaireservice-npm-install,source=/dependencies/psa.service.questionnaireservice,target=/dependencies/psa.service.questionnaireservice \
	--mount=type=bind,ro,from=psa.service.sampletrackingservice-npm-install,source=/dependencies/psa.service.sampletrackingservice,target=/dependencies/psa.service.sampletrackingservice \
	--mount=type=bind,ro,from=psa.service.sormasservice-npm-install,source=/dependencies/psa.service.sormasservice,target=/dependencies/psa.service.sormasservice \
	--mount=type=bind,ro,from=psa.service.userservice-npm-install,source=/dependencies/psa.service.userservice,target=/dependencies/psa.service.userservice \
	--mount=type=bind,ro,from=psa.utils.deploymentservice-npm-install,source=/dependencies/psa.utils.deploymentservice,target=/dependencies/psa.utils.deploymentservice \
	--mount=type=bind,ro,from=psa.utils.repo-tool-npm-install,source=/dependencies/psa.utils.repo-tool,target=/dependencies/psa.utils.repo-tool \
	REPO_DIR=/dependencies OUT_FILE=/licenses.csv node /app/index.js license

FROM scratch
COPY --from=base /licenses.csv /
