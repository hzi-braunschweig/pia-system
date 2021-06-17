const expect = require('chai').expect;

const RESTPresenter = require('./RESTPresenter');

const maliciousQuestionText =
  'Welche Symptome haben Sie? <img src=x onerror=alert(1)//>';
const sanitizedQuestionText = 'Welche Symptome haben Sie? <img src="x">';

describe('RESTPresenter', function () {
  describe('#presentQuestionnaire', function () {
    it('should return a links section', function () {
      const questionnaireObj = {
        id: 999,
        study_id: 1,
        name: 'Testfragebogenname2',
        no_questions: 1,
        cycle_amount: 1,
        version: 1,
        cycle_unit: 'week',
        trigger_date: '2017-11-13T00:00:00.000Z',
        questions: [
          {
            id: 2,
            questionnaire_id: 2,
            text: 'Welche Symptome haben Sie?',
            position: 1,
            answer_options: [
              {
                id: 2,
                question_id: 2,
                text: 'Fieber?',
                answer_type_id: 1,
                values: ['string'],
              },
            ],
          },
        ],
      };

      let actual = RESTPresenter.presentQuestionnaire(questionnaireObj);

      expect(actual).to.have.property('links');
      expect(actual.links.self).to.deep.equal({
        href: '/questionnaires/999/1',
      });

      questionnaireObj.questions[0].text = maliciousQuestionText;
      actual = RESTPresenter.presentQuestionnaire(questionnaireObj);
      expect(actual.questions[0].text).to.equal(sanitizedQuestionText);
    });
  });

  describe('#presentQuestionnaires', function () {
    it('should return a links section', function () {
      const questionnaireArr = [
        {
          id: 999,
          study_id: 1,
          name: 'Testfragebogenname2',
          no_questions: 1,
          cycle_amount: 1,
          cycle_unit: 'week',
          trigger_date: '2017-11-13T00:00:00.000Z',
          questions: [
            {
              id: 2,
              questionnaire_id: 2,
              text: 'Welche Symptome haben Sie?',
              position: 1,
              answer_options: [
                {
                  id: 2,
                  question_id: 2,
                  text: 'Fieber?',
                  answer_type_id: 1,
                  values: ['string'],
                },
              ],
            },
          ],
        },
      ];

      let actual = RESTPresenter.presentQuestionnaires(questionnaireArr);

      expect(actual).to.have.property('links');
      expect(actual.links.self).to.deep.equal({ href: '/questionnaires' });

      questionnaireArr[0].questions[0].text = maliciousQuestionText;
      actual = RESTPresenter.presentQuestionnaires(questionnaireArr);
      expect(actual.questionnaires[0].questions[0].text).to.equal(
        sanitizedQuestionText
      );
    });
  });

  describe('#presentAnswertype', function () {
    it('should return a links section', function () {
      const answertypeObj = {
        id: 999,
        type: 'bool',
      };

      const actual = RESTPresenter.presentAnswertype(answertypeObj);

      expect(actual).to.have.property('links');
      expect(actual.links.self).to.deep.equal({ href: '/answertypes/999' });
    });
  });

  describe('#presentAnswertypes', function () {
    it('should return a links section', function () {
      const answertypeArr = [
        {
          id: 999,
          type: 'bool',
        },
      ];

      const actual = RESTPresenter.presentAnswertypes(answertypeArr);

      expect(actual).to.have.property('links');
      expect(actual.links.self).to.deep.equal({ href: '/answertypes' });
    });
  });

  describe('#presentStudy', function () {
    it('should return a links section', function () {
      const studyObj = {
        name: 'Teststudie',
        start_date: '1111-01-01T00:00:00.000Z',
        end_date: '2222-01-01T00:00:00.000Z',
        running: false,
      };

      const actual = RESTPresenter.presentStudy(studyObj);

      expect(actual).to.have.property('links');
      expect(actual.links.self).to.deep.equal({ href: '/studies/Teststudie' });
    });
  });

  describe('#presentStudies', function () {
    it('should return a links section', function () {
      const studiesArr = [
        {
          name: 'Teststudie1',
          start_date: '1111-01-01T00:00:00.000Z',
          end_date: '2222-01-01T00:00:00.000Z',
          running: false,
        },
        {
          name: 'Teststudie2',
          start_date: '1111-01-01T00:00:00.000Z',
          end_date: '2222-01-01T00:00:00.000Z',
          running: false,
        },
      ];

      const actual = RESTPresenter.presentStudies(studiesArr);

      expect(actual).to.have.property('links');
      expect(actual.links.self).to.deep.equal({ href: '/studies' });
    });
  });

  describe('#presentQuestionnaireInstance', function () {
    it('should return a links section', function () {
      const questionnaireInstanceObj = {
        id: 999,
        study_id: 1,
        questionnaire_id: 1,
        user_id: 'Testproband',
        date_of_issue: '2017-11-16T00:00:00.000Z',
        released: false,
        questions: [
          {
            id: 2,
            questionnaire_id: 2,
            text: 'Welche Symptome haben Sie?',
            position: 1,
            answer_options: [
              {
                id: 2,
                question_id: 2,
                text: 'Fieber?',
                answer_type_id: 1,
                values: ['string'],
              },
            ],
          },
        ],
      };

      let actual = RESTPresenter.presentQuestionnaireInstance(
        questionnaireInstanceObj
      );

      expect(actual).to.have.property('links');
      expect(actual.links.self).to.deep.equal({
        href: '/questionnaireInstances/999',
      });
      expect(actual.links.answers).to.deep.equal({
        href: '/questionnaireInstances/999/answers',
      });

      questionnaireInstanceObj.questions[0].text = maliciousQuestionText;
      actual = RESTPresenter.presentQuestionnaire(questionnaireInstanceObj);
      expect(actual.questions[0].text).to.equal(sanitizedQuestionText);
    });
  });

  describe('#presentQuestionnaireInstances', function () {
    it('should return a links section', function () {
      const questionnaireInstancesArr = [
        {
          id: 998,
          study_id: 1,
          questionnaire_id: 1,
          user_id: 'Testproband',
          date_of_issue: '2017-11-16T00:00:00.000Z',
          released: false,
          questions: [
            {
              id: 2,
              questionnaire_id: 2,
              text: 'Welche Symptome haben Sie?',
              position: 1,
              answer_options: [
                {
                  id: 2,
                  question_id: 2,
                  text: 'Fieber?',
                  answer_type_id: 1,
                  values: ['string'],
                },
              ],
            },
          ],
        },
        {
          id: 999,
          study_id: 1,
          questionnaire_id: 1,
          user_id: 'Testproband',
          date_of_issue: '2017-11-23T00:00:00.000Z',
          released: false,
        },
      ];

      let actual = RESTPresenter.presentQuestionnaireInstances(
        questionnaireInstancesArr
      );

      expect(actual).to.have.property('links');
      expect(actual.links.self).to.deep.equal({
        href: '/questionnaireInstances',
      });

      questionnaireInstancesArr[0].questions[0].text = maliciousQuestionText;
      actual = RESTPresenter.presentQuestionnaires(questionnaireInstancesArr);
      expect(actual.questionnaires[0].questions[0].text).to.equal(
        sanitizedQuestionText
      );
    });
  });

  describe('#presentAnswers', function () {
    it('should return a links section', function () {
      const answersArr = [
        {
          questionnaire_instance_id: 1,
          question_id: 1,
          answer_option_id: 1,
          value: 'Hahaha',
        },
        {
          questionnaire_instance_id: 1,
          question_id: 1,
          answer_option_id: 2,
          value: 'Ja',
        },
      ];

      const actual = RESTPresenter.presentAnswers(answersArr, 1);

      expect(actual).to.have.property('links');
      expect(actual.links.self).to.deep.equal({
        href: '/questionnaireInstances/1/answers',
      });
    });
  });
});
