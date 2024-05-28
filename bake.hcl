group "default" {
  targets = [ 
"k8s", "psa_app_mobile", "psa_app_web", "psa_database", "psa_database_ewpia", "psa_database_ipia", "psa_lib_auth-server-client", "psa_lib_charts", "psa_lib_hapi-i18n-plugin", "psa_lib_http-clients-internal", "psa_lib_licensecollector", "psa_lib_messagequeue", "psa_lib_publicapi", "psa_lib_service-core", "psa_lib_templatepipeline", "psa_server_apigateway", "psa_server_auth", "psa_server_autheventproxy", "psa_server_eventhistory", "psa_server_mailserver", "psa_server_messagequeue", "psa_server_publicapi", "psa_server_sftpserver", "psa_service_analyzerservice", "psa_service_complianceservice", "psa_service_feedbackstatisticservice", "psa_service_loggingservice", "psa_service_modysservice", "psa_service_notificationservice", "psa_service_personaldataservice", "psa_service_questionnaireservice", "psa_service_sampletrackingservice", "psa_service_sormasservice", "psa_service_userservice", "psa_test_data", "psa_utils_ci-analyze-secret-report", "psa_utils_ci-git-mirror", "psa_utils_ci-release-image", "psa_utils_ci-thirdparty-license-collector", "psa_utils_codeformatter", "psa_utils_coverage", "psa_utils_deploymentservice", "psa_utils_e2e-runner", "psa_utils_repo-tool"
  ]
}

group "deployment" {
  targets = [ 
"k8s", "psa_app_mobile", "psa_app_web", "psa_database", "psa_database_ewpia", "psa_database_ipia", "psa_server_apigateway", "psa_server_auth", "psa_server_autheventproxy", "psa_server_eventhistory", "psa_server_mailserver", "psa_server_messagequeue", "psa_server_publicapi", "psa_server_sftpserver", "psa_service_analyzerservice", "psa_service_complianceservice", "psa_service_feedbackstatisticservice", "psa_service_loggingservice", "psa_service_modysservice", "psa_service_notificationservice", "psa_service_personaldataservice", "psa_service_questionnaireservice", "psa_service_sampletrackingservice", "psa_service_sormasservice", "psa_service_userservice"
  ]
}

variable "TAG" {
  default = "develop"
}

variable "IMAGE_REGISTRY" {
  default = "pia"
}

variable "VERSION_INFO_PIPELINE_ID" {
  default = "develop"
}

variable "VERSION_INFO_GIT_HASH" {
  default = "UNKNOWN"
}

variable "VERSION_INFO_GIT_REF" {
  default = "UNKNOWN"
}

target "k8s" {
  context = "."
  dockerfile = "k8s/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/k8s:${TAG}" ]
  args = {
    DIR = "k8s"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_app_mobile" {
  context = "."
  dockerfile = "psa.app.mobile/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.app.mobile:${TAG}" ]
  args = {
    DIR = "psa.app.mobile"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_app_web" {
  context = "."
  dockerfile = "psa.app.web/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.app.web:${TAG}" ]
  args = {
    DIR = "psa.app.web"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_database" {
  context = "."
  dockerfile = "psa.database/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.database:${TAG}" ]
  args = {
    DIR = "psa.database"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_database_ewpia" {
  context = "."
  dockerfile = "psa.database.ewpia/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.database.ewpia:${TAG}" ]
  args = {
    DIR = "psa.database.ewpia"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_database_ipia" {
  context = "."
  dockerfile = "psa.database.ipia/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.database.ipia:${TAG}" ]
  args = {
    DIR = "psa.database.ipia"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_lib_auth-server-client" {
  context = "."
  dockerfile = "psa.lib.auth-server-client/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.lib.auth-server-client:${TAG}" ]
  args = {
    DIR = "psa.lib.auth-server-client"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_lib_charts" {
  context = "."
  dockerfile = "psa.lib.charts/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.lib.charts:${TAG}" ]
  args = {
    DIR = "psa.lib.charts"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_lib_hapi-i18n-plugin" {
  context = "."
  dockerfile = "psa.lib.hapi-i18n-plugin/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.lib.hapi-i18n-plugin:${TAG}" ]
  args = {
    DIR = "psa.lib.hapi-i18n-plugin"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_lib_http-clients-internal" {
  context = "."
  dockerfile = "psa.lib.http-clients-internal/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.lib.http-clients-internal:${TAG}" ]
  args = {
    DIR = "psa.lib.http-clients-internal"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_lib_licensecollector" {
  context = "."
  dockerfile = "psa.lib.licensecollector/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.lib.licensecollector:${TAG}" ]
  args = {
    DIR = "psa.lib.licensecollector"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_lib_messagequeue" {
  context = "."
  dockerfile = "psa.lib.messagequeue/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.lib.messagequeue:${TAG}" ]
  args = {
    DIR = "psa.lib.messagequeue"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_lib_publicapi" {
  context = "."
  dockerfile = "psa.lib.publicapi/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.lib.publicapi:${TAG}" ]
  args = {
    DIR = "psa.lib.publicapi"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_lib_service-core" {
  context = "."
  dockerfile = "psa.lib.service-core/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.lib.service-core:${TAG}" ]
  args = {
    DIR = "psa.lib.service-core"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_lib_templatepipeline" {
  context = "."
  dockerfile = "psa.lib.templatepipeline/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.lib.templatepipeline:${TAG}" ]
  args = {
    DIR = "psa.lib.templatepipeline"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_server_apigateway" {
  context = "."
  dockerfile = "psa.server.apigateway/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.server.apigateway:${TAG}" ]
  args = {
    DIR = "psa.server.apigateway"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_server_auth" {
  context = "."
  dockerfile = "psa.server.auth/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.server.auth:${TAG}" ]
  args = {
    DIR = "psa.server.auth"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_server_autheventproxy" {
  context = "."
  dockerfile = "psa.server.autheventproxy/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.server.autheventproxy:${TAG}" ]
  args = {
    DIR = "psa.server.autheventproxy"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_server_eventhistory" {
  context = "."
  dockerfile = "psa.server.eventhistory/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.server.eventhistory:${TAG}" ]
  args = {
    DIR = "psa.server.eventhistory"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_server_mailserver" {
  context = "."
  dockerfile = "psa.server.mailserver/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.server.mailserver:${TAG}" ]
  args = {
    DIR = "psa.server.mailserver"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_server_messagequeue" {
  context = "."
  dockerfile = "psa.server.messagequeue/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.server.messagequeue:${TAG}" ]
  args = {
    DIR = "psa.server.messagequeue"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_server_publicapi" {
  context = "."
  dockerfile = "psa.server.publicapi/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.server.publicapi:${TAG}" ]
  args = {
    DIR = "psa.server.publicapi"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_server_sftpserver" {
  context = "."
  dockerfile = "psa.server.sftpserver/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.server.sftpserver:${TAG}" ]
  args = {
    DIR = "psa.server.sftpserver"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_service_analyzerservice" {
  context = "."
  dockerfile = "psa.service.analyzerservice/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.service.analyzerservice:${TAG}" ]
  args = {
    DIR = "psa.service.analyzerservice"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_service_complianceservice" {
  context = "."
  dockerfile = "psa.service.complianceservice/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.service.complianceservice:${TAG}" ]
  args = {
    DIR = "psa.service.complianceservice"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_service_feedbackstatisticservice" {
  context = "."
  dockerfile = "psa.service.feedbackstatisticservice/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.service.feedbackstatisticservice:${TAG}" ]
  args = {
    DIR = "psa.service.feedbackstatisticservice"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_service_loggingservice" {
  context = "."
  dockerfile = "psa.service.loggingservice/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.service.loggingservice:${TAG}" ]
  args = {
    DIR = "psa.service.loggingservice"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_service_modysservice" {
  context = "."
  dockerfile = "psa.service.modysservice/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.service.modysservice:${TAG}" ]
  args = {
    DIR = "psa.service.modysservice"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_service_notificationservice" {
  context = "."
  dockerfile = "psa.service.notificationservice/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.service.notificationservice:${TAG}" ]
  args = {
    DIR = "psa.service.notificationservice"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_service_personaldataservice" {
  context = "."
  dockerfile = "psa.service.personaldataservice/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.service.personaldataservice:${TAG}" ]
  args = {
    DIR = "psa.service.personaldataservice"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_service_questionnaireservice" {
  context = "."
  dockerfile = "psa.service.questionnaireservice/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.service.questionnaireservice:${TAG}" ]
  args = {
    DIR = "psa.service.questionnaireservice"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_service_sampletrackingservice" {
  context = "."
  dockerfile = "psa.service.sampletrackingservice/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.service.sampletrackingservice:${TAG}" ]
  args = {
    DIR = "psa.service.sampletrackingservice"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_service_sormasservice" {
  context = "."
  dockerfile = "psa.service.sormasservice/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.service.sormasservice:${TAG}" ]
  args = {
    DIR = "psa.service.sormasservice"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_service_userservice" {
  context = "."
  dockerfile = "psa.service.userservice/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.service.userservice:${TAG}" ]
  args = {
    DIR = "psa.service.userservice"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_test_data" {
  context = "."
  dockerfile = "psa.test.data/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.test.data:${TAG}" ]
  args = {
    DIR = "psa.test.data"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_utils_ci-analyze-secret-report" {
  context = "."
  dockerfile = "psa.utils.ci-analyze-secret-report/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.utils.ci-analyze-secret-report:${TAG}" ]
  args = {
    DIR = "psa.utils.ci-analyze-secret-report"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_utils_ci-git-mirror" {
  context = "."
  dockerfile = "psa.utils.ci-git-mirror/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.utils.ci-git-mirror:${TAG}" ]
  args = {
    DIR = "psa.utils.ci-git-mirror"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_utils_ci-release-image" {
  context = "."
  dockerfile = "psa.utils.ci-release-image/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.utils.ci-release-image:${TAG}" ]
  args = {
    DIR = "psa.utils.ci-release-image"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_utils_ci-thirdparty-license-collector" {
  context = "."
  dockerfile = "psa.utils.ci-thirdparty-license-collector/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.utils.ci-thirdparty-license-collector:${TAG}" ]
  args = {
    DIR = "psa.utils.ci-thirdparty-license-collector"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_utils_codeformatter" {
  context = "."
  dockerfile = "psa.utils.codeformatter/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.utils.codeformatter:${TAG}" ]
  args = {
    DIR = "psa.utils.codeformatter"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_utils_coverage" {
  context = "."
  dockerfile = "psa.utils.coverage/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.utils.coverage:${TAG}" ]
  args = {
    DIR = "psa.utils.coverage"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_utils_deploymentservice" {
  context = "."
  dockerfile = "psa.utils.deploymentservice/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.utils.deploymentservice:${TAG}" ]
  args = {
    DIR = "psa.utils.deploymentservice"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_utils_e2e-runner" {
  context = "."
  dockerfile = "psa.utils.e2e-runner/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.utils.e2e-runner:${TAG}" ]
  args = {
    DIR = "psa.utils.e2e-runner"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}
target "psa_utils_repo-tool" {
  context = "."
  dockerfile = "psa.utils.repo-tool/Dockerfile"
  tags = [ "${IMAGE_REGISTRY}/psa.utils.repo-tool:${TAG}" ]
  args = {
    DIR = "psa.utils.repo-tool"
    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"
    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"
    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"
  }
}