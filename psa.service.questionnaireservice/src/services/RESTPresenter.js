const { sanitizeHtml } = require('@pia/lib-service-core');

/**
 * @description json REST presenter
 */
const RESTPresenter = (function () {
  function constructQuestionnaireLinks(id, version) {
    return {
      self: { href: '/questionnaires/' + id + '/' + version },
    };
  }

  function constructQuestionnairesLinks() {
    return {
      self: { href: '/questionnaires' },
    };
  }

  function constructAnswertypeLinks(id) {
    return {
      self: { href: '/answertypes/' + id },
    };
  }

  function constructAnswertypesLinks() {
    return {
      self: { href: '/answertypes' },
    };
  }

  function constructStudyLinks(id) {
    return {
      self: { href: '/studies/' + id },
    };
  }

  function constructStudiesLinks() {
    return {
      self: { href: '/studies' },
    };
  }

  function constructStudyAccessLinks(access) {
    return {
      self: {
        href: '/studies/' + access.study_id + '/accesses/' + access.user_id,
      },
    };
  }

  function constructStudyAccessesLinks(study_id) {
    return {
      self: { href: '/studies/' + study_id + '/accesses' },
    };
  }

  function constructQuestionnaireInstanceLinks(id) {
    return {
      self: { href: '/questionnaireInstances/' + id },
      answers: { href: '/questionnaireInstances/' + id + '/answers' },
    };
  }

  function constructQuestionnaireInstancesLinks() {
    return {
      self: { href: '/questionnaireInstances' },
    };
  }

  function constructAnswersLinks(qInstanceId) {
    return {
      self: { href: '/questionnaireInstances/' + qInstanceId + '/answers' },
    };
  }

  function constructAllAnswersLinks(username) {
    return {
      self: { href: '/probands/' + username + '/answers' },
    };
  }

  function constructAllQueuesLinks(username) {
    return {
      self: { href: '/probands/' + username + '/queues' },
    };
  }

  function constructQueueLinks(user_id, instance_id) {
    return {
      self: { href: '/probands/' + user_id + '/queues/' + instance_id },
    };
  }

  function presentQuestionnaire(questionnaireObj) {
    if (questionnaireObj) {
      sanitizeQuestions(questionnaireObj);
      questionnaireObj.links = constructQuestionnaireLinks(
        questionnaireObj.id,
        questionnaireObj.version
      );
    }
    return questionnaireObj;
  }

  function presentQuestionnaires(questionnairesArr) {
    const ret = {};
    ret.questionnaires = questionnairesArr;
    ret.questionnaires.forEach(function (questionnaire) {
      sanitizeQuestions(questionnaire);
    });

    ret.links = constructQuestionnairesLinks();

    return ret;
  }

  function presentAnswertype(answertypesObj) {
    if (answertypesObj) {
      answertypesObj.links = constructAnswertypeLinks(answertypesObj.id);
    }
    return answertypesObj;
  }

  function presentAnswertypes(answertypessArr) {
    const ret = {};
    ret.answertypes = answertypessArr;
    ret.links = constructAnswertypesLinks();

    return ret;
  }

  function presentStudy(studyObj) {
    if (studyObj) {
      studyObj.links = constructStudyLinks(studyObj.name);
    }
    return studyObj;
  }

  function presentStudyWelcomeText(studyWelcomeTextObj) {
    if (studyWelcomeTextObj) {
      return {
        welcome_text: sanitizeHtml(studyWelcomeTextObj.welcome_text),
        study_id: studyWelcomeTextObj.study_id,
        language: studyWelcomeTextObj.language,
      };
    }
    return null;
  }

  function presentStudies(studiesArr) {
    const ret = {};
    ret.studies = studiesArr;
    ret.links = constructStudiesLinks();

    return ret;
  }

  function presentStudyAccess(accessObj) {
    if (accessObj) {
      accessObj.links = constructStudyAccessLinks(accessObj);
    }
    return accessObj;
  }

  function presentStudyAccesses(accessesArr, study_id) {
    const ret = {};
    ret.study_accesses = accessesArr;
    ret.links = constructStudyAccessesLinks(study_id);

    return ret;
  }

  function presentQuestionnaireInstance(qInstanceObj) {
    if (qInstanceObj) {
      if (qInstanceObj.questionnaire && qInstanceObj.questionnaire.questions) {
        sanitizeQuestions(qInstanceObj.questionnaire);
      }
      qInstanceObj.links = constructQuestionnaireInstanceLinks(qInstanceObj.id);
    }
    return qInstanceObj;
  }

  function presentQuestionnaireInstances(questionnaireInstancesArr) {
    const ret = {};
    ret.questionnaireInstances = questionnaireInstancesArr;
    ret.questionnaireInstances.forEach(function (qInstance) {
      if (qInstance.questionnaire && qInstance.questionnaire.questions) {
        sanitizeQuestions(qInstance.questionnaire);
      }
    });
    ret.links = constructQuestionnaireInstancesLinks();

    return ret;
  }

  function presentAnswers(answersArr, qInstanceId) {
    const ret = {};
    ret.answers = answersArr;
    ret.links = constructAnswersLinks(qInstanceId);

    return ret;
  }

  function presentAllAnswers(answersArr, username) {
    const ret = {};
    ret.answers = answersArr;
    ret.links = constructAllAnswersLinks(username);

    return ret;
  }

  function presentAllQueues(queuesArr, username) {
    const ret = {};
    ret.queues = queuesArr;
    ret.links = constructAllQueuesLinks(username);

    return ret;
  }

  function presentQueue(queueObj) {
    if (queueObj) {
      queueObj.links = constructQueueLinks(
        queueObj.user_id,
        queueObj.questionnaire_instance_id
      );
    }
    return queueObj;
  }

  function sanitizeQuestions(qObj) {
    if (qObj.questions) {
      qObj.questions.forEach(function (question, i, arr) {
        arr[i].text = sanitizeHtml(question.text);
      });
    }
  }

  return {
    /**
     * @function
     * @description presents a questionnaire object as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} questionnaireObj the questionnaires object to present
     * @param {number} id the id of the questionnaire
     * @returns a questionnaire object as a REST compliant json object
     */
    presentQuestionnaire: presentQuestionnaire,

    /**
     * @function
     * @description presents an array of questionnaires as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} questionnairesArr the questionnaires array to present
     * @returns a questionnaires object as a REST compliant json object
     */
    presentQuestionnaires: presentQuestionnaires,

    /**
     * @function
     * @description presents a answertype object as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} answertypeObj the answertype object to present
     * @param {number} id the id of the answertype
     * @returns a answertype object as a REST compliant json object
     */
    presentAnswertype: presentAnswertype,

    /**
     * @function
     * @description presents an array of answertypes as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} answertypesArr the answertype array to present
     * @returns a answertypes object as a REST compliant json object
     */
    presentAnswertypes: presentAnswertypes,

    /**
     * @function
     * @description presents a study object as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} studyObj the study object to present
     * @param {number} id the id of the study
     * @returns a study object as a REST compliant json object
     */
    presentStudy: presentStudy,

    /**
     * @function
     * @description presents a study welcome text object as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} studyWelcomeTextObj the study welcome text object to present
     * @returns a study welcome text object as a REST compliant json object
     */
    presentStudyWelcomeText: presentStudyWelcomeText,

    /**
     * @function
     * @description presents an array of studies as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} studiesArr the studies array to present
     * @returns a studies object as a REST compliant json object
     */
    presentStudies: presentStudies,

    /**
     * @function
     * @description presents a study access object as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} accessObj the study access object to present
     * @returns a study access object as a REST compliant json object
     */
    presentStudyAccess: presentStudyAccess,

    /**
     * @function
     * @description presents an array of study accesses as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} accessesArr the study accesses array to present
     * @param {string} study_id the study id of the accesses array
     * @returns a study accesses object as a REST compliant json object
     */
    presentStudyAccesses: presentStudyAccesses,

    /**
     * @function
     * @description presents a questionnaire instance object as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} studyObj the questionnaire instance object to present
     * @param {number} id the id of the questionnaire instance
     * @returns a questionnaire instance object as a REST compliant json object
     */
    presentQuestionnaireInstance: presentQuestionnaireInstance,

    /**
     * @function
     * @description presents an array of questionnaire instances as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} studiesArr the questionnaire instances array to present
     * @returns a questionnaire instances object as a REST compliant json object
     */
    presentQuestionnaireInstances: presentQuestionnaireInstances,

    /**
     * @function
     * @description presents an array of answers as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} answersArr the answers array to present
     * @returns a answers object as a REST compliant json object
     */
    presentAnswers: presentAnswers,

    /**
     * @function
     * @description presents an array of answers as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} answersArr the answers array to present
     * @returns a answers object as a REST compliant json object
     */
    presentAllAnswers: presentAllAnswers,

    /**
     * @function
     * @description presents an array of queues as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} queuesArr the queues array to present
     * @returns a answers object as a REST compliant json object
     */
    presentAllQueues: presentAllQueues,

    /**
     * @function
     * @description presents a study queue object as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} queueObj the queue object to present
     * @returns a queue object as a REST compliant json object
     */
    presentQueue: presentQueue,
  };
})();

module.exports = RESTPresenter;
