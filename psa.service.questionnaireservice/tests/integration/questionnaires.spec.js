const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const secretOrPrivateKey = require('../secretOrPrivateKey');
const JWT = require('jsonwebtoken');

const {
  setup,
  cleanup,
} = require('./questionnaireInstances.spec.data/setup.helper');

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT + '/questionnaire';

const { db } = require('../../src/db');

const format = require('date-fns/format');
const startOfToday = require('date-fns/startOfToday');

const probandSession1 = { id: 1, role: 'Proband', username: 'QTestProband1' };
const probandSession2 = { id: 1, role: 'Proband', username: 'QTestProband2' };
const probandSession3 = { id: 1, role: 'Proband', username: 'QTestProband3' };
const probandSession5 = { id: 1, role: 'Proband', username: 'QTestProband5' };
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher1',
};
const forscherSession2 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher2',
};

const invalidToken = JWT.sign(probandSession1, 'thisIsNotAValidPrivateKey', {
  algorithm: 'HS256',
  expiresIn: '24h',
});
const probandToken1 = JWT.sign(probandSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const probandToken2 = JWT.sign(probandSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const probandToken3 = JWT.sign(probandSession3, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const probandToken5 = JWT.sign(probandSession5, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken1 = JWT.sign(forscherSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken2 = JWT.sign(forscherSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const invalidHeader = { authorization: invalidToken };
const probandHeader1 = { authorization: probandToken1 };
const probandHeader2 = { authorization: probandToken2 };
const probandHeader3 = { authorization: probandToken3 };
const probandHeader5 = { authorization: probandToken5 };
const forscherHeader1 = { authorization: forscherToken1 };
const forscherHeader2 = { authorization: forscherToken2 };

const missingFieldQuestionnaire = {
  study_id: 'ApiTestStudie',
  name: 'Testfragebogenname',
  activate_after_days: 1,
  deactivate_after_days: 365,
  notification_tries: 3,
  notification_title: 'PIA Fragebogen',
  notification_body_new: 'Sie haben einen neuen Fragebogen',
  notification_body_in_progress: 'Sie haben einen unvollständigen Fragebogen',
  notification_weekday: 'monday',
  notification_interval: '1',
  notification_interval_unit: 'days',
  questions: [
    {
      text: 'Welche Symptome haben Sie?',
      position: 1,
      answer_options: [
        {
          text: 'Fieber?',
          answer_type_id: 1,
          values: [{ value: 'Ja' }, { value: 'Nein' }],
          values_code: [{ value: 1 }, { value: 0 }],
        },
        {
          text: 'Kopfschmerzen?',
          answer_type_id: 1,
          values: [{ value: 'Ja' }, { value: 'Nein' }],
          values_code: [{ value: 1 }, { value: 0 }],
        },
      ],
    },
    {
      text: 'Wie geht es Ihnen?',
      position: 2,
      answer_options: [
        {
          answer_type_id: 2,
          values: [
            { value: 'Schlecht' },
            { value: 'Normal' },
            { value: 'Gut' },
            { value: 'Keine Angabe' },
          ],
          values_code: [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 0 }],
        },
      ],
    },
  ],
};

const validQuestionnaire1 = {
  study_id: 'ApiTestStudie',
  name: 'Testfragebogenname1',
  type: 'for_probands',
  cycle_amount: 7,
  cycle_unit: 'hour',
  cycle_per_day: 2,
  cycle_first_hour: 6,
  publish: 'allaudiences',
  keep_answers: false,
  activate_after_days: 1,
  deactivate_after_days: 365,
  notification_tries: 3,
  notification_title: 'PIA Fragebogen',
  notification_body_new: 'Sie haben einen neuen Fragebogen',
  notification_body_in_progress: 'Sie haben einen unvollständigen Fragebogen',
  notification_weekday: 'monday',
  notification_interval: '1',
  notification_interval_unit: 'days',
  activate_at_date: format(startOfToday(), 'yyyy.MM.dd'),
  compliance_needed: true,
  expires_after_days: 5,
  questions: [
    {
      text: 'Welche Symptome haben Sie?1',
      position: 1,
      is_mandatory: true,
      label: '',
      answer_options: [
        {
          text: 'Fieber?1',
          answer_type_id: 1,
          values: [{ value: 'Ja' }, { value: 'Nein' }],
          values_code: null,
          position: 1,
          label: 'ao1',
          is_notable: [],
        },
        {
          text: 'Kopfschmerzen?1',
          answer_type_id: 1,
          values: [{ value: 'Ja' }, { value: 'Nein' }],
          position: 2,
          label: 'ao2',
          is_notable: [],
        },
        {
          text: 'Seit wann haben Sie Fieber?2',
          answer_type_id: 5,
          values: [],
          values_code: [],
          restriction_min: -7,
          restriction_max: 7,
          is_decimal: false,
          position: 3,
          label: 'ao3',
          is_notable: [],
        },
        {
          text: 'Wie fühlen Sie sich?2',
          answer_type_id: 3,
          values: [],
          values_code: [],
          restriction_min: 0,
          restriction_max: 100,
          is_decimal: false,
          position: 4,
          label: 'ao4',
          is_notable: [],
        },
      ],
    },
    {
      text: 'Wie geht es Ihnen?1',
      position: 2,
      is_mandatory: true,
      label: 'q1',
      answer_options: [
        {
          answer_type_id: 2,
          values: [
            { value: 'Schlecht' },
            { value: 'Normal' },
            { value: 'Gut' },
            { value: 'Keine Angabe' },
          ],
          values_code: [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 0 }],
          position: 1,
          label: 'ao1',
          is_notable: [],
        },
      ],
    },
  ],
};

const validQuestionnaire2 = {
  study_id: 'ApiTestStudie',
  name: 'Testfragebogenname2',
  type: 'for_research_team',
  cycle_amount: 1,
  cycle_unit: 'once',
  publish: 'allaudiences',
  keep_answers: false,
  activate_after_days: 0,
  deactivate_after_days: 365,
  notification_tries: 0,
  notification_title: '',
  notification_body_new: '',
  notification_body_in_progress: '',
  notification_weekday: '',
  notification_interval: '0',
  notification_interval_unit: '',
  expires_after_days: 5,
  questions: [
    {
      text: 'Welche Symptome haben Sie?2',
      position: 1,
      is_mandatory: true,
      label: '',
      answer_options: [
        {
          text: 'Fieber?2',
          answer_type_id: 1,
          values: [{ value: 'Ja' }, { value: 'Nein' }],
          values_code: [{ value: 1 }, { value: 0 }],
          position: 1,
          label: '',
          is_notable: [],
        },
        {
          text: 'Kopfschmerzen?2',
          answer_type_id: 1,
          values: [{ value: 'Ja' }, { value: 'Nein' }],
          values_code: [{ value: 1 }, { value: 0 }],
          position: 2,
          label: '',
          is_notable: [],
        },
      ],
    },
    {
      text: 'Wie geht es Ihnen?2',
      position: 2,
      is_mandatory: true,
      label: '',
      answer_options: [
        {
          answer_type_id: 2,
          values: [
            { value: 'Schlecht' },
            { value: 'Normal' },
            { value: 'Gut' },
            { value: 'Keine Angabe' },
          ],
          values_code: [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 0 }],
          position: 1,
          label: '',
          is_notable: [],
        },
      ],
    },
  ],
};

const validQuestionnaireImported = {
  study_id: 'ApiTestStudie',
  name: 'Testfragebogenname5',
  type: 'for_probands',
  cycle_amount: 1,
  cycle_unit: 'week',
  publish: 'allaudiences',
  activate_after_days: 1,
  deactivate_after_days: 365,
  notification_tries: 3,
  notification_title: 'PIA Fragebogen',
  notification_body_new: 'Sie haben einen neuen Fragebogen',
  notification_body_in_progress: 'Sie haben einen unvollständigen Fragebogen',
  notification_weekday: 'monday',
  notification_interval: '1',
  notification_interval_unit: 'days',
  expires_after_days: 5,
  questions: [
    {
      text: 'Welche Symptome haben Sie?2',
      position: 1,
      is_mandatory: true,
      label: '',
      answer_options: [
        {
          text: 'Fieber?2',
          answer_type_id: 1,
          values: [{ value: 'Ja' }, { value: 'Nein' }],
          values_code: [{ value: 1 }, { value: 0 }],
          position: 1,
          label: '',
          is_notable: [],
        },
        {
          text: 'Kopfschmerzen?2',
          answer_type_id: 1,
          values: [{ value: 'Ja' }, { value: 'Nein' }],
          values_code: [{ value: 1 }, { value: 0 }],
          position: 2,
          label: '',
          is_notable: [],
        },
      ],
    },
    {
      text: 'Wie geht es Ihnen?2',
      position: 2,
      is_mandatory: true,
      label: '',
      answer_options: [
        {
          answer_type_id: 2,
          values: [
            { value: 'Schlecht' },
            { value: 'Normal' },
            { value: 'Gut' },
            { value: 'Keine Angabe' },
          ],
          values_code: [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 0 }],
          position: 1,
          label: '',
          is_notable: [],
        },
      ],
    },
  ],
};

const validQuestionnaireEmptyQuestion = {
  study_id: 'ApiTestStudie',
  name: 'Testfragebogenname3',
  type: 'for_probands',
  cycle_amount: 1,
  cycle_unit: 'week',
  publish: 'allaudiences',
  activate_after_days: 1,
  deactivate_after_days: 365,
  notification_tries: 3,
  notification_title: 'PIA Fragebogen',
  notification_body_new: 'Sie haben einen neuen Fragebogen',
  notification_body_in_progress: 'Sie haben einen unvollständigen Fragebogen',
  notification_weekday: 'monday',
  notification_interval: '1',
  notification_interval_unit: 'hours',
  expires_after_days: 5,
  questions: [
    {
      text: 'Dies ist ein Info Text1',
      position: 1,
      is_mandatory: false,
      label: '',
      answer_options: [],
    },
    {
      text: 'Dies ist ein Info Text2',
      position: 2,
      is_mandatory: false,
      label: '',
      answer_options: [],
    },
  ],
};

const wrongNotificationQuestionnaire = {
  study_id: 'ApiTestStudie',
  name: 'Testfragebogenname3',
  type: 'for_probands',
  cycle_amount: 1,
  cycle_unit: 'week',
  publish: 'allaudiences',
  activate_after_days: 1,
  deactivate_after_days: 365,
  notification_tries: 3,
  notification_title: 'PIA Fragebogen',
  notification_body_new: 'Sie haben einen neuen Fragebogen',
  notification_body_in_progress: 'Sie haben einen unvollständigen Fragebogen',
  notification_weekday: 'notaweekday',
  notification_interval: '1',
  notification_interval_unit: 'hours',
  expires_after_days: 5,
  questions: [
    {
      text: 'Dies ist ein Info Text1',
      position: 1,
      is_mandatory: false,
      label: '',
      answer_options: [],
    },
    {
      text: 'Dies ist ein Info Text2',
      position: 2,
      is_mandatory: false,
      label: '',
      answer_options: [],
    },
  ],
};

const validQuestionnaireSpontan = {
  study_id: 'ApiTestStudie',
  name: 'Testfragebogenname4',
  type: 'for_probands',
  cycle_amount: 0,
  cycle_unit: 'spontan',
  publish: 'allaudiences',
  activate_after_days: 0,
  deactivate_after_days: 0,
  notification_tries: 0,
  notification_title: '',
  notification_body_new: '',
  notification_body_in_progress: '',
  notification_weekday: '',
  notification_interval: 0,
  notification_interval_unit: '',
  questions: [
    {
      text: 'Welche Symptome haben Sie?1',
      position: 1,
      is_mandatory: true,
      label: '',
      answer_options: [
        {
          text: 'Fieber?1',
          answer_type_id: 1,
          values: [{ value: 'Ja' }, { value: 'Nein' }],
          values_code: null,
          position: 1,
          label: '',
        },
        {
          text: 'Kopfschmerzen?1',
          answer_type_id: 1,
          values: [{ value: 'Ja' }, { value: 'Nein' }],
          position: 2,
          label: '',
        },
      ],
    },
    {
      text: 'Wie geht es Ihnen?1',
      position: 2,
      is_mandatory: true,
      label: '',
      answer_options: [
        {
          answer_type_id: 2,
          values: [
            { value: 'Schlecht' },
            { value: 'Normal' },
            { value: 'Gut' },
            { value: 'Keine Angabe' },
          ],
          values_code: [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 0 }],
          position: 1,
          label: '',
          is_notable: [],
        },
      ],
    },
  ],
};

let addedQuestionnaire1 = {};
let addedQuestionnaire2 = {};
let addedQuestionnaire1V2 = {};
let addedQuestionnaireEmptyQuestion = {};

describe('/questionnaires', function () {
  before(async function () {
    await server.init();
    await setup();
  });

  after(async function () {
    await server.stop();
    await cleanup();
  });

  describe('POST', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(invalidHeader)
        .send(validQuestionnaire1);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(probandHeader1)
        .send(validQuestionnaire1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 400 if the questionnaire is invalid', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(missingFieldQuestionnaire);
      expect(result).to.have.status(400);
    });

    it('should return HTTP 400 if the questionnaire has wrong value in field', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(wrongNotificationQuestionnaire);
      expect(result).to.have.status(400);
    });

    it('should return HTTP 403 if the study_id is invalid', async function () {
      const wrongStudyQuestionnaire = JSON.parse(
        JSON.stringify(validQuestionnaire1)
      );
      wrongStudyQuestionnaire.study_id = 'noValidStudy';
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(wrongStudyQuestionnaire);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if the user has no write access to study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader2)
        .send(validQuestionnaire1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 with the posted questionnaire if the request is valid', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(validQuestionnaire1);
      expect(result).to.have.status(200);
      expect(result.body.id).to.not.equal(undefined);
      expect(result.body.id).to.not.equal(null);
      expect(result.body.version).to.equal(1);
      expect(result.body.name).to.equal('Testfragebogenname1');
      expect(
        format(new Date(result.body.activate_at_date), 'yyyy.MM.dd')
      ).to.equal(format(startOfToday(), 'yyyy.MM.dd'));
      expect(result.body.compliance_needed).to.equal(true);
      expect(result.body.cycle_per_day).to.equal(2);
      expect(result.body.cycle_first_hour).to.equal(6);
      expect(result.body.expires_after_days).to.equal(5);
      expect(result.body.questions.length).to.equal(2);
      expect(result.body.questions[0].text).to.equal(
        'Welche Symptome haben Sie?1'
      );
      expect(result.body.questions[0].label).to.equal('');
      expect(result.body.questions[1].text).to.equal('Wie geht es Ihnen?1');
      expect(result.body.questions[0].is_mandatory).to.be.true;
      expect(result.body.questions[1].is_mandatory).to.be.true;
      expect(result.body.questions[0].answer_options.length).to.equal(4);
      expect(result.body.questions[0].answer_options[0].text).to.equal(
        'Fieber?1'
      );
      expect(result.body.questions[0].answer_options[0].label).to.equal('ao1');
      expect(result.body.questions[0].answer_options[1].text).to.equal(
        'Kopfschmerzen?1'
      );
      expect(result.body.questions[0].answer_options[1].label).to.equal('ao2');
      expect(result.body.questions[0].answer_options[2].text).to.equal(
        'Seit wann haben Sie Fieber?2'
      );
      expect(result.body.questions[0].answer_options[3].text).to.equal(
        'Wie fühlen Sie sich?2'
      );
      expect(result.body.questions[1].answer_options.length).to.equal(1);
      expect(result.body.questions[1].answer_options[0].values.length).to.equal(
        4
      );
      expect(
        result.body.questions[1].answer_options[0].values_code.length
      ).to.equal(4);
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' + result.body.id + '/' + result.body.version
      );

      addedQuestionnaire1 = result.body;
    });

    it('should return HTTP 200 with the posted questionnaire and conditions if the request is valid', async function () {
      validQuestionnaire2.condition = {
        condition_type: 'external',
        condition_target_questionnaire: addedQuestionnaire1.id,
        condition_target_answer_option:
          addedQuestionnaire1.questions[0].answer_options[0].id,
        condition_operand: '==',
        condition_value: 'Ja',
      };

      validQuestionnaire2.questions[0].condition = {
        condition_type: 'internal_last',
        condition_target_questionnaire: addedQuestionnaire1.id,
        condition_target_answer_option:
          addedQuestionnaire1.questions[0].answer_options[0].id,
        condition_operand: '==',
        condition_value: 'Ja',
      };

      validQuestionnaire2.questions[0].answer_options[0].condition = {
        condition_type: 'internal_this',
        condition_target_questionnaire: addedQuestionnaire1.id,
        condition_target_answer_option:
          addedQuestionnaire1.questions[0].answer_options[0].id,
        condition_operand: '==',
        condition_value: 'Ja',
      };

      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(validQuestionnaire2);
      expect(result).to.have.status(200);
      expect(result.body.id).to.not.equal(undefined);
      expect(result.body.id).to.not.equal(null);
      expect(result.body.name).to.equal('Testfragebogenname2');
      expect(result.body.condition).to.not.equal(undefined);
      expect(result.body.condition.condition_target_questionnaire).to.equal(
        addedQuestionnaire1.id
      );
      expect(
        result.body.condition.condition_target_questionnaire_version
      ).to.equal(addedQuestionnaire1.version);
      expect(result.body.condition.condition_target_answer_option).to.equal(
        addedQuestionnaire1.questions[0].answer_options[0].id
      );
      expect(result.body.condition.condition_questionnaire_id).to.equal(
        result.body.id
      );
      expect(result.body.condition.condition_question_id).to.equal(null);
      expect(result.body.condition.condition_answer_option_id).to.equal(null);
      expect(result.body.condition.error).to.equal(undefined);
      expect(result.body.compliance_needed).to.equal(false);
      expect(result.body.expires_after_days).to.equal(5);
      expect(result.body.keep_answers).to.be.false;
      expect(result.body.questions.length).to.equal(2);
      expect(result.body.questions[0].condition).to.not.equal(undefined);
      expect(
        result.body.questions[0].condition.condition_target_questionnaire
      ).to.equal(result.body.id);
      expect(
        result.body.questions[0].condition.condition_target_answer_option
      ).to.equal(addedQuestionnaire1.questions[0].answer_options[0].id);
      expect(
        result.body.questions[0].condition.condition_questionnaire_id
      ).to.equal(null);
      expect(result.body.questions[0].condition.condition_question_id).to.equal(
        result.body.questions[0].id
      );
      expect(
        result.body.questions[0].condition.condition_answer_option_id
      ).to.equal(null);
      expect(result.body.questions[0].condition.error).to.equal(undefined);
      expect(result.body.questions[0].is_mandatory).to.be.true;
      expect(result.body.questions[1].is_mandatory).to.be.true;
      expect(result.body.questions[0].text).to.equal(
        'Welche Symptome haben Sie?2'
      );
      expect(result.body.questions[1].text).to.equal('Wie geht es Ihnen?2');
      expect(result.body.questions[0].answer_options.length).to.equal(2);
      expect(result.body.questions[0].answer_options[0].condition).to.not.equal(
        undefined
      );
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_target_questionnaire
      ).to.equal(result.body.id);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_target_answer_option
      ).to.equal(addedQuestionnaire1.questions[0].answer_options[0].id);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_questionnaire_id
      ).to.equal(null);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_question_id
      ).to.equal(null);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_answer_option_id
      ).to.equal(result.body.questions[0].answer_options[0].id);
      expect(
        result.body.questions[0].answer_options[0].condition.error
      ).to.equal(undefined);
      expect(result.body.questions[0].answer_options[0].text).to.equal(
        'Fieber?2'
      );
      expect(result.body.questions[0].answer_options[1].text).to.equal(
        'Kopfschmerzen?2'
      );
      expect(result.body.questions[1].answer_options.length).to.equal(1);
      expect(result.body.questions[1].answer_options[0].values.length).to.equal(
        4
      );
      expect(
        result.body.questions[1].answer_options[0].values_code.length
      ).to.equal(4);
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' + result.body.id + '/1'
      );

      addedQuestionnaire2 = result.body;
    });

    it('should return HTTP 200 with the imported questionnaire and conditions if the request is valid', async function () {
      validQuestionnaireImported.condition = {
        condition_type: 'external',
        condition_target_questionnaire: 838383838,
        condition_target_answer_option:
          addedQuestionnaire1.questions[0].answer_options[0].id,
        condition_operand: '==',
        condition_value: 'Ja',
      };

      validQuestionnaireImported.questions[0].condition = {
        condition_type: 'external',
        condition_target_questionnaire: addedQuestionnaire1.id,
        condition_target_answer_option: 7474747474,
        condition_operand: '==',
        condition_value: 'Ja',
      };

      validQuestionnaireImported.questions[0].answer_options[0].condition = {
        condition_type: 'internal_this',
        condition_target_question_pos: 1,
        condition_target_answer_option_pos: 2,
        condition_operand: '==',
        condition_value: 'Ja',
      };

      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(validQuestionnaireImported);
      expect(result).to.have.status(200);
      expect(result.body.id).to.not.equal(undefined);
      expect(result.body.id).to.not.equal(null);
      expect(result.body.name).to.equal('Testfragebogenname5');
      expect(result.body.condition).to.not.equal(undefined);
      expect(result.body.condition.error).to.equal(404);
      expect(result.body.compliance_needed).to.equal(false);
      expect(result.body.expires_after_days).to.equal(5);
      expect(result.body.questions.length).to.equal(2);
      expect(result.body.questions[0].condition).to.not.equal(undefined);
      expect(result.body.questions[0].condition.error).to.equal(404);
      expect(result.body.questions[0].is_mandatory).to.be.true;
      expect(result.body.questions[1].is_mandatory).to.be.true;
      expect(result.body.questions[0].text).to.equal(
        'Welche Symptome haben Sie?2'
      );
      expect(result.body.questions[1].text).to.equal('Wie geht es Ihnen?2');
      expect(result.body.questions[0].answer_options.length).to.equal(2);
      expect(result.body.questions[0].answer_options[0].condition).to.not.equal(
        undefined
      );
      expect(
        result.body.questions[0].answer_options[0].condition.error
      ).to.equal(undefined);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_target_questionnaire
      ).to.equal(result.body.id);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_target_answer_option
      ).to.equal(result.body.questions[0].answer_options[1].id);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_questionnaire_id
      ).to.equal(null);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_question_id
      ).to.equal(null);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_answer_option_id
      ).to.equal(result.body.questions[0].answer_options[0].id);
      expect(result.body.questions[0].answer_options[0].text).to.equal(
        'Fieber?2'
      );
      expect(result.body.questions[0].answer_options[1].text).to.equal(
        'Kopfschmerzen?2'
      );
      expect(result.body.questions[1].answer_options.length).to.equal(1);
      expect(result.body.questions[1].answer_options[0].values.length).to.equal(
        4
      );
      expect(
        result.body.questions[1].answer_options[0].values_code.length
      ).to.equal(4);
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' + result.body.id + '/1'
      );
    });

    it('should return HTTP 200 with the posted questionnaire if the questionnaire has no answer options', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(validQuestionnaireEmptyQuestion);
      expect(result).to.have.status(200);
      expect(result.body.id).to.not.equal(undefined);
      expect(result.body.id).to.not.equal(null);
      expect(result.body.name).to.equal('Testfragebogenname3');
      expect(result.body.expires_after_days).to.equal(5);
      expect(result.body.questions.length).to.equal(2);
      expect(result.body.questions[0].text).to.equal('Dies ist ein Info Text1');
      expect(result.body.questions[1].text).to.equal('Dies ist ein Info Text2');
      expect(result.body.questions[0].is_mandatory).to.be.false;
      expect(result.body.questions[1].is_mandatory).to.be.false;
      expect(result.body.questions[0].answer_options.length).to.equal(0);
      expect(result.body.questions[1].answer_options.length).to.equal(0);
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' + result.body.id + '/1'
      );

      addedQuestionnaireEmptyQuestion = result.body;
    });

    it('should return HTTP 200 with the posted questionnaire of cycle_unit =  spontan', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(validQuestionnaireSpontan);
      expect(result).to.have.status(200);
      expect(result.body.id).to.not.equal(undefined);
      expect(result.body.id).to.not.equal(null);
      expect(result.body.name).to.equal('Testfragebogenname4');
      expect(result.body.cycle_unit).to.equal('spontan');
      expect(result.body.publish).to.equal('allaudiences');
      expect(result.body.expires_after_days).to.equal(5);
      expect(result.body.questions.length).to.equal(2);
      expect(result.body.questions[0].text).to.equal(
        'Welche Symptome haben Sie?1'
      );
      expect(result.body.questions[1].text).to.equal('Wie geht es Ihnen?1');
      expect(result.body.questions[0].is_mandatory).to.be.true;
      expect(result.body.questions[1].is_mandatory).to.be.true;
      expect(result.body.questions[0].answer_options.length).to.equal(2);
      expect(result.body.questions[0].answer_options[0].text).to.equal(
        'Fieber?1'
      );
      expect(result.body.questions[0].answer_options[1].text).to.equal(
        'Kopfschmerzen?1'
      );
      expect(result.body.questions[1].answer_options.length).to.equal(1);
      expect(result.body.questions[1].answer_options[0].values.length).to.equal(
        4
      );
      expect(
        result.body.questions[1].answer_options[0].values_code.length
      ).to.equal(4);
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' + result.body.id + '/1'
      );
    });
    it('should return HTTP 200 with the posted questionnaire if the questionnaire answer options answer_type_id = 9(date_time)', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(validQuestionnaireEmptyQuestion);
      expect(result).to.have.status(200);
    });
  });

  describe('POST revisequestionnaire/id', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/revisequestionnaire/' + addedQuestionnaire1.id)
        .set(invalidHeader)
        .send(validQuestionnaire1);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/revisequestionnaire/' + addedQuestionnaire1.id)
        .set(probandHeader1)
        .send(validQuestionnaire1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 400 if the questionnaire is invalid', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/revisequestionnaire/' + addedQuestionnaire1.id)
        .set(forscherHeader1)
        .send(missingFieldQuestionnaire);
      expect(result).to.have.status(400);
    });

    it('should return HTTP 403 if the study_id is invalid', async function () {
      const wrongStudyQuestionnaire = JSON.parse(
        JSON.stringify(validQuestionnaire1)
      );
      wrongStudyQuestionnaire.study_id = 'noValidStudy';
      const result = await chai
        .request(apiAddress)
        .post('/revisequestionnaire/' + addedQuestionnaire1.id)
        .set(forscherHeader1)
        .send(wrongStudyQuestionnaire);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if the user has no write access to old study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/revisequestionnaire/' + addedQuestionnaire1.id)
        .set(forscherHeader2)
        .send(validQuestionnaire1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if the questionnaire id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/revisequestionnaire/' + 99999999)
        .set(forscherHeader1)
        .send(validQuestionnaire1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 with the new version of questionnaire if the request is valid, copy questions and answer_options and do not modify old version of questionnaire', async function () {
      const changedConditionQuestionnaire = JSON.parse(
        JSON.stringify(validQuestionnaire1)
      );

      changedConditionQuestionnaire.questions = [
        validQuestionnaire1.questions[0],
      ];
      changedConditionQuestionnaire.questions[0].answer_options = [
        validQuestionnaire1.questions[0].answer_options[0],
        validQuestionnaire1.questions[0].answer_options[1],
      ];
      changedConditionQuestionnaire.cycle_amount = 5;
      changedConditionQuestionnaire.keep_answers = true;
      delete changedConditionQuestionnaire.condition;

      const result = await chai
        .request(apiAddress)
        .post('/revisequestionnaire/' + addedQuestionnaire1.id)
        .set(forscherHeader1)
        .send(changedConditionQuestionnaire);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(addedQuestionnaire1.id);
      expect(result.body.cycle_amount).to.equal(5);
      expect(result.body.version).to.equal(2);
      expect(result.body.keep_answers).to.be.true;
      expect(result.body.cycle_per_day).to.equal(2);
      expect(result.body.cycle_first_hour).to.equal(6);
      expect(result.body.questions.length).to.equal(1);
      expect(result.body.questions[0].id).to.not.equal(
        addedQuestionnaire1.questions[0].id
      );
      expect(result.body.questions[0].text).to.equal(
        'Welche Symptome haben Sie?1'
      );
      expect(result.body.questions[0].answer_options.length).to.equal(2);
      expect(result.body.questions[0].answer_options[0].id).to.not.equal(
        addedQuestionnaire1.questions[0].answer_options[0].id
      );
      expect(result.body.questions[0].answer_options[1].id).to.not.equal(
        addedQuestionnaire1.questions[0].answer_options[1].id
      );
      expect(result.body.questions[0].answer_options[0].text).to.equal(
        'Fieber?1'
      );

      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' + addedQuestionnaire1.id + '/2'
      );
      addedQuestionnaire1V2 = result.body;

      const result2 = await chai
        .request(apiAddress)
        .get('/questionnaires/' + addedQuestionnaire1.id + '/' + 1)
        .set(probandHeader1);
      expect(result2.body.id).to.equal(addedQuestionnaire1.id);
      expect(result2.body.cycle_amount).to.equal(7);
      expect(result2.body.version).to.equal(1);
      expect(result2.body.keep_answers).to.be.false;
      expect(result2.body.questions.length).to.equal(2);
      expect(result2.body.questions[0].id).to.equal(
        addedQuestionnaire1.questions[0].id
      );
      expect(result2.body.questions[0].text).to.equal(
        'Welche Symptome haben Sie?1'
      );
      expect(result2.body.questions[0].answer_options.length).to.equal(4);
      expect(result2.body.questions[0].answer_options[0].id).to.equal(
        addedQuestionnaire1.questions[0].answer_options[0].id
      );
      expect(result2.body.questions[0].answer_options[1].id).to.equal(
        addedQuestionnaire1.questions[0].answer_options[1].id
      );
      expect(result2.body.questions[0].answer_options[0].text).to.equal(
        'Fieber?1'
      );
    });
  });

  describe('PUT', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            addedQuestionnaire1.id +
            '/' +
            addedQuestionnaire1.version
        )
        .set(invalidHeader)
        .send(validQuestionnaire1);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            addedQuestionnaire1.id +
            '/' +
            addedQuestionnaire1.version
        )
        .set(probandHeader1)
        .send(validQuestionnaire1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 400 if the questionnaire is invalid', async function () {
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            addedQuestionnaire1.id +
            '/' +
            addedQuestionnaire1.version
        )
        .set(forscherHeader1)
        .send(missingFieldQuestionnaire);
      expect(result).to.have.status(400);
    });

    it('should return HTTP 403 if the study_id is invalid', async function () {
      const wrongStudyQuestionnaire = JSON.parse(
        JSON.stringify(validQuestionnaire1)
      );
      wrongStudyQuestionnaire.study_id = 'noValidStudy';
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            addedQuestionnaire1.id +
            '/' +
            addedQuestionnaire1.version
        )
        .set(forscherHeader1)
        .send(wrongStudyQuestionnaire);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if the user has no write access to old study', async function () {
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            addedQuestionnaire1.id +
            '/' +
            addedQuestionnaire1.version
        )
        .set(forscherHeader2)
        .send(validQuestionnaire1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if the questionnaire id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/questionnaires/99999999/1')
        .set(forscherHeader1)
        .send(validQuestionnaire1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if the condition has invalid answer_option_id', async function () {
      const wrongConditionQuestionnaire = JSON.parse(
        JSON.stringify(validQuestionnaire2)
      );
      wrongConditionQuestionnaire.condition = JSON.parse(
        JSON.stringify(addedQuestionnaire2.condition)
      );
      delete wrongConditionQuestionnaire.condition.condition_questionnaire_id;
      delete wrongConditionQuestionnaire.version;
      delete wrongConditionQuestionnaire.condition
        .condition_questionnaire_version;
      delete wrongConditionQuestionnaire.condition
        .condition_target_questionnaire_version;

      delete wrongConditionQuestionnaire.condition.condition_question_id;
      delete wrongConditionQuestionnaire.condition.condition_answer_option_id;
      delete wrongConditionQuestionnaire.condition.id;
      wrongConditionQuestionnaire.condition.condition_target_answer_option = 9999999;
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            addedQuestionnaire2.id +
            '/' +
            addedQuestionnaire2.version
        )
        .set(forscherHeader1)
        .send(wrongConditionQuestionnaire);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 with the changed questionnaire and condition if the request is valid and update is_condition_target of target answer option', async function () {
      const changedConditionQuestionnaire = JSON.parse(
        JSON.stringify(validQuestionnaire2)
      );
      changedConditionQuestionnaire.condition = JSON.parse(
        JSON.stringify(addedQuestionnaire2.condition)
      );
      delete changedConditionQuestionnaire.condition.condition_questionnaire_id;
      delete changedConditionQuestionnaire.condition
        .condition_questionnaire_version;
      delete changedConditionQuestionnaire.condition
        .condition_target_questionnaire_version;

      delete changedConditionQuestionnaire.condition.condition_question_id;
      delete changedConditionQuestionnaire.condition.condition_answer_option_id;
      delete changedConditionQuestionnaire.condition.id;
      changedConditionQuestionnaire.condition.condition_target_answer_option =
        addedQuestionnaire1.questions[1].answer_options[0].id;

      delete changedConditionQuestionnaire.questions[0].condition;

      changedConditionQuestionnaire.questions[0].answer_options[0].condition =
        JSON.parse(
          JSON.stringify(
            addedQuestionnaire2.questions[0].answer_options[0].condition
          )
        );
      delete changedConditionQuestionnaire.questions[0].answer_options[0]
        .condition.condition_questionnaire_id;
      delete changedConditionQuestionnaire.version;
      delete changedConditionQuestionnaire.questions[0].answer_options[0]
        .condition.condition_questionnaire_version;
      delete changedConditionQuestionnaire.questions[0].answer_options[0]
        .condition.condition_target_questionnaire_version;

      delete changedConditionQuestionnaire.questions[0].answer_options[0]
        .condition.condition_question_id;
      delete changedConditionQuestionnaire.questions[0].answer_options[0]
        .condition.condition_answer_option_id;
      delete changedConditionQuestionnaire.questions[0].answer_options[0]
        .condition.id;
      changedConditionQuestionnaire.questions[0].answer_options[0].condition.condition_target_answer_option =
        addedQuestionnaire1.questions[1].answer_options[0].id;

      changedConditionQuestionnaire.name = 'Testfragebogenname2Geändert';
      changedConditionQuestionnaire.compliance_needed = true;
      changedConditionQuestionnaire.keep_answers = true;
      changedConditionQuestionnaire.questions[0].label = 'q1changed';
      changedConditionQuestionnaire.questions[0].answer_options[0].text =
        'Fieber?2Geändert';
      changedConditionQuestionnaire.questions[0].answer_options[0].label =
        'ao1changed';
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            addedQuestionnaire2.id +
            '/' +
            addedQuestionnaire2.version
        )
        .set(forscherHeader1)
        .send(changedConditionQuestionnaire);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(addedQuestionnaire2.id);
      expect(result.body.name).to.equal('Testfragebogenname2Geändert');
      expect(result.body.version).to.equal(addedQuestionnaire2.version);
      expect(result.body.condition).to.not.equal(undefined);
      expect(result.body.condition.condition_questionnaire_id).to.equal(
        result.body.id
      );
      expect(result.body.condition.condition_target_answer_option).to.equal(
        addedQuestionnaire1.questions[1].answer_options[0].id
      );
      expect(result.body.compliance_needed).to.equal(true);
      expect(result.body.expires_after_days).to.equal(5);
      expect(result.body.cycle_per_day).to.equal(null);
      expect(result.body.cycle_first_hour).to.equal(null);
      expect(result.body.keep_answers).to.be.true;
      expect(result.body.questions.length).to.equal(2);
      expect(result.body.questions[0].condition).to.equal(undefined);
      expect(result.body.questions[0].is_mandatory).to.be.true;
      expect(result.body.questions[0].label).to.equal('q1changed');
      expect(result.body.questions[1].is_mandatory).to.be.true;
      expect(result.body.questions[0].text).to.equal(
        'Welche Symptome haben Sie?2'
      );
      expect(result.body.questions[1].text).to.equal('Wie geht es Ihnen?2');
      expect(result.body.questions[0].answer_options.length).to.equal(2);
      expect(result.body.questions[0].answer_options[0].condition).to.not.equal(
        undefined
      );
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_questionnaire_id
      ).to.equal(null);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_question_id
      ).to.equal(null);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_answer_option_id
      ).to.equal(result.body.questions[0].answer_options[0].id);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_target_answer_option
      ).to.equal(addedQuestionnaire1.questions[1].answer_options[0].id);
      expect(result.body.questions[0].answer_options[0].text).to.equal(
        'Fieber?2Geändert'
      );
      expect(result.body.questions[0].answer_options[0].label).to.equal(
        'ao1changed'
      );
      expect(result.body.questions[0].answer_options[1].text).to.equal(
        'Kopfschmerzen?2'
      );
      expect(result.body.questions[0].answer_options[1].label).to.equal('');
      expect(result.body.questions[1].answer_options.length).to.equal(1);
      expect(result.body.questions[1].answer_options[0].values.length).to.equal(
        4
      );
      expect(
        result.body.questions[1].answer_options[0].values_code.length
      ).to.equal(4);
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' +
          addedQuestionnaire2.id +
          '/' +
          addedQuestionnaire2.version
      );

      addedQuestionnaire2 = result.body;

      const result2 = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            addedQuestionnaire1.id +
            '/' +
            addedQuestionnaire1.version
        )
        .set(probandHeader1);
      expect(result2).to.have.status(200);
      expect(
        result2.body.questions[0].answer_options[0].is_condition_target
      ).to.equal(false);
      expect(
        result2.body.questions[1].answer_options[0].is_condition_target
      ).to.equal(true);
    });

    it('should return HTTP 200, delete the question and delete the condition of secondary questionnaire', async function () {
      const changedQuestionnaire = JSON.parse(
        JSON.stringify(validQuestionnaire1)
      );
      changedQuestionnaire.questions.pop();

      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            addedQuestionnaire1.id +
            '/' +
            addedQuestionnaire1.version
        )
        .set(forscherHeader1)
        .send(changedQuestionnaire);
      expect(result).to.have.status(200);
      expect(result.body.questions.length).to.equal(1);

      addedQuestionnaire1 = result.body;

      const result2 = await chai
        .request(apiAddress)
        .get('/questionnaires/' + addedQuestionnaire1.id + '/' + 1)
        .set(forscherHeader1);
      expect(result2).to.have.status(200);
      expect(result2.body.version).to.equal(1);
      expect(result2.body.questions.length).to.equal(1);
      expect(result2.body.questions[0].id).to.equal(
        addedQuestionnaire1.questions[0].id
      );
      expect(result2.body.questions[0].text).to.equal(
        addedQuestionnaire1.questions[0].text
      );
      expect(result2.body.questions[0].is_mandatory).to.equal(
        addedQuestionnaire1.questions[0].is_mandatory
      );
      expect(result2.body.questions[0].label).to.equal(
        addedQuestionnaire1.questions[0].label
      );

      const result3 = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            addedQuestionnaire2.id +
            '/' +
            addedQuestionnaire2.version
        )
        .set(probandHeader1);
      expect(result3).to.have.status(200);
      expect(result3.body.condition).to.equal(null);

      addedQuestionnaire2 = result3.body;
    });

    it('should return HTTP 200 with the changed questionnaire with empty questions', async function () {
      const changedQuestionnaire = JSON.parse(
        JSON.stringify(validQuestionnaireEmptyQuestion)
      );
      changedQuestionnaire.questions.pop();
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            addedQuestionnaireEmptyQuestion.id +
            '/' +
            addedQuestionnaireEmptyQuestion.version
        )
        .set(forscherHeader1)
        .send(changedQuestionnaire);
      expect(result).to.have.status(200);
      expect(result.body.questions.length).to.equal(1);
    });

    it('should return HTTP 200 and update version 2 of questionnaire without changing version 1', async function () {
      const changedQuestionnaire = JSON.parse(
        JSON.stringify(validQuestionnaire1)
      );
      changedQuestionnaire.name = 'TestfragebogenVersion2';
      changedQuestionnaire.cycle_amount = 2;
      changedQuestionnaire.cycle_unit = 'month';
      changedQuestionnaire.questions = [
        {
          text: 'Version2 question',
          position: 1,
          is_mandatory: false,
          label: 'v2 question',
          answer_options: [
            {
              answer_type_id: 2,
              values: [
                { value: 'Nein' },
                { value: 'Ja' },
                { value: 'Keine Angabe' },
              ],
              values_code: [{ value: 1 }, { value: 2 }, { value: 0 }],
              position: 1,
              label: 'v2 ao',
            },
          ],
        },
      ];

      const result = await chai
        .request(apiAddress)
        .put('/questionnaires/' + addedQuestionnaire1V2.id + '/2')
        .set(forscherHeader1)
        .send(changedQuestionnaire);
      expect(result).to.have.status(200);
      expect(result.body.name).to.equal('TestfragebogenVersion2');
      expect(result.body.cycle_amount).to.equal(2);
      expect(result.body.cycle_unit).to.equal('month');
      expect(result.body.version).to.equal(2);
      expect(result.body.questions.length).to.equal(1);
      expect(result.body.questions[0].id).to.not.equal(
        addedQuestionnaire1V2.questions[0].id
      );
      expect(result.body.questions[0].id).to.not.equal(
        addedQuestionnaire1V2.questions[0].id
      );
      expect(result.body.questions[0].text).to.equal('Version2 question');
      expect(result.body.questions[0].is_mandatory).to.equal(false);
      expect(result.body.questions[0].label).to.equal('v2 question');
      expect(result.body.questions[0].questionnaire_version).to.equal(2);
      expect(result.body.questions[0].answer_options.length).to.equal(1);
      expect(result.body.questions[0].answer_options[0].id).to.not.equal(
        addedQuestionnaire1V2.questions[0].answer_options[0].id
      );
      expect(result.body.questions[0].answer_options[0].id).to.not.equal(
        addedQuestionnaire1V2.questions[0].answer_options[0].id
      );
      expect(result.body.questions[0].answer_options[0].label).to.equal(
        'v2 ao'
      );

      const result2 = await chai
        .request(apiAddress)
        .get('/questionnaires/' + addedQuestionnaire1.id + '/' + 1)
        .set(forscherHeader1);
      expect(result2).to.have.status(200);
      expect(result2.body.name).to.equal(addedQuestionnaire1.name);
      expect(result2.body.cycle_amount).to.equal(
        addedQuestionnaire1.cycle_amount
      );
      expect(result2.body.cycle_unit).to.equal(addedQuestionnaire1.cycle_unit);
      expect(result2.body.version).to.equal(1);

      expect(result2.body.questions.length).to.equal(1);
      expect(result2.body.questions[0].id).to.equal(
        addedQuestionnaire1.questions[0].id
      );
      expect(result2.body.questions[0].text).to.equal(
        addedQuestionnaire1.questions[0].text
      );
      expect(result2.body.questions[0].is_mandatory).to.equal(
        addedQuestionnaire1.questions[0].is_mandatory
      );
      expect(result2.body.questions[0].label).to.equal(
        addedQuestionnaire1.questions[0].label
      );

      expect(result2.body.questions[0].answer_options.length).to.equal(2);
      expect(result2.body.questions[0].answer_options[0].id).to.equal(
        addedQuestionnaire1.questions[0].answer_options[0].id
      );
      expect(result2.body.questions[0].answer_options[1].id).to.equal(
        addedQuestionnaire1.questions[0].answer_options[1].id
      );
      expect(result2.body.questions[0].answer_options[0].label).to.equal(
        addedQuestionnaire1.questions[0].answer_options[0].label
      );
      expect(result2.body.questions[0].answer_options[1].label).to.equal(
        addedQuestionnaire1.questions[0].answer_options[1].label
      );
    });
  });

  describe('GET questionnaires', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 if a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires')
        .set(probandHeader2);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 with the correct questionnaires for Forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires')
        .set(forscherHeader1);

      expect(result).to.have.status(200);
      expect(result.body.questionnaires.length).to.equal(12);
      expect(result.body.questionnaires[0].study_id).to.equal('ApiTestStudie');
      expect(result.body.questionnaires[1].study_id).to.equal('ApiTestStudie');
      expect(result.body.questionnaires[2].study_id).to.equal('ApiTestStudie');
      expect(result.body.questionnaires[3].study_id).to.equal('ApiTestStudie');
      expect(result.body.questionnaires[4].study_id).to.equal('ApiTestStudie');

      expect(result.body.links.self.href).to.equal('/questionnaires');
    });
  });

  describe('GET questionnaires/id', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires/' + addedQuestionnaire1.id + '/1')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 404 if the questionnaire id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires/' + 999999 + '/1')
        .set(probandHeader1);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if the version of questionnaire does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires/' + 999999 + '/99')
        .set(probandHeader1);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if the user has no read access to study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires/' + addedQuestionnaire1.id + '/1')
        .set(probandHeader2);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if proband tries to get questionnaire he did not comply to get', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires/' + addedQuestionnaire1.id + '/1')
        .set(probandHeader3);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 200 with the correct questionnaire and version 1', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires/' + addedQuestionnaire1.id + '/1')
        .set(probandHeader1);
      expect(result, result.text).to.have.status(200);
      expect(result.body.name).to.equal('Testfragebogenname1');
      expect(result.body.version).to.equal(1);
      expect(result.body.expires_after_days).to.equal(5);
      expect(result.body.questions.length).to.equal(1);
      expect(result.body.questions[0].answer_options.length).to.equal(2);
      expect(result.body.questions[0].answer_options[0].text).to.equal(
        'Fieber?1'
      );
      expect(result.body.questions[0].answer_options[1].text).to.equal(
        'Kopfschmerzen?1'
      );
      expect(result.body.questions[0].answer_options[1].values.length).to.equal(
        2
      );
      expect(result.body.questions[0].answer_options[0].values_code).to.equal(
        null
      );
      expect(result.body.questions[0].answer_options[1].values_code).to.equal(
        null
      );
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' + addedQuestionnaire1.id + '/1'
      );
    });

    it('should return HTTP 200 with the correct questionnaire and version 2', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires/' + 99999 + '/2')
        .set(probandHeader1);
      expect(result).to.have.status(200);
      expect(result.body.name).to.equal('ApiTestQuestionnaire');
      expect(result.body.version).to.equal(2);
      expect(result.body.expires_after_days).to.equal(5);
      expect(result.body.questions.length).to.equal(2);
      expect(result.body.questions[0].id).to.equal(999912);
      expect(result.body.questions[1].id).to.equal(999922);
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' + 99999 + '/2'
      );
    });

    it('should return HTTP 200 with the correct questionnaire and conditions', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires/' + 888889 + '/1')
        .set(probandHeader5);
      expect(result).to.have.status(200);
      expect(result.body.name).to.equal('ApiTestConditionSourceQuestionnaire');
      expect(result.body.expires_after_days).to.equal(5);
      expect(result.body.questions.length).to.equal(3);
      expect(result.body.questions[0].answer_options.length).to.equal(2);
      expect(result.body.questions[1].answer_options.length).to.equal(2);
      expect(result.body.questions[2].answer_options.length).to.equal(0);
      expect(result.body.questions[0].condition).to.not.equal(undefined);
      expect(result.body.questions[1].condition).to.not.equal(undefined);
      expect(result.body.questions[0].answer_options[0].condition).to.not.equal(
        undefined
      );
      expect(result.body.questions[0].answer_options[1].condition).to.equal(
        null
      );
      expect(result.body.questions[1].answer_options[0].condition).to.not.equal(
        undefined
      );
      expect(result.body.questions[1].answer_options[1].condition).to.equal(
        null
      );
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' + 888889 + '/1'
      );
    });

    it('should return HTTP 200 with the correct questionnaire with empty question', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires/' + addedQuestionnaireEmptyQuestion.id + '/1')
        .set(probandHeader1);
      expect(result).to.have.status(200);
      expect(result.body.name).to.equal('Testfragebogenname3');
      expect(result.body.expires_after_days).to.equal(5);
      expect(result.body.questions.length).to.equal(1);
      expect(result.body.questions[0].answer_options.length).to.equal(0);
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' + addedQuestionnaireEmptyQuestion.id + '/1'
      );
    });
  });

  describe('DELETE', function () {
    before(async function () {
      await db.any(
        "INSERT INTO questionnaires VALUES (999998, 'ApiTestStudie', 'ApiTestQuestionnaire', 1, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht', 'AltNachricht', null, null, null, null, true)"
      );
      await db.any(
        "INSERT INTO questionnaire_instances VALUES (999996, 'ApiTestStudie', 999998, 'ApiTestQuestionnaire', 'QTestProband1', '08.08.2017', null, null, 1, 'active')"
      );
      await db.any(
        "INSERT INTO questions VALUES (999991, 999998, 'Haben Sie Fieber?', 1, true)"
      );
      await db.any(
        "INSERT INTO answer_options(id, question_id, text, answer_type_id, position) VALUES (999982, 999991, 'Bitte laden sie das das erte Bild hoch', 8, 1)"
      );
      await db.any(
        "INSERT INTO answer_options(id, question_id, text, answer_type_id, position) VALUES (999983, 999991, 'Bitte laden sie das das zweite bild hoch Bild hoch', 8, 1)"
      );
      await db.any(
        "INSERT INTO user_files VALUES (999999, 'QTestProband1', 999996, 999982, 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC')"
      );
      await db.any(
        "INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, versioning, value) VALUES (999996, 999991, 999983, 1, '999999')"
      );
    });

    after(async function () {
      await db.none('DELETE FROM answers WHERE answer_option_id=999983');
      await db.none('DELETE FROM user_files WHERE id=999999');
      await db.none('DELETE FROM answer_options WHERE id=999983');
      await db.none('DELETE FROM answer_options WHERE id=999982');
      await db.none('DELETE FROM questions WHERE id=999991');
      await db.none('DELETE FROM questionnaire_instances WHERE id=999996');
      await db.none('DELETE FROM questionnaires WHERE id=999998');
    });

    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaires/' +
            addedQuestionnaire1.id +
            '/' +
            addedQuestionnaire1.version
        )
        .set(invalidHeader)
        .send({});
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 if the questionnaire id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/questionnaires/999999/1')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaires/' +
            addedQuestionnaire1.id +
            '/' +
            addedQuestionnaire1.version
        )
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if the user has no write access to study', async function () {
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaires/' +
            addedQuestionnaire1.id +
            '/' +
            addedQuestionnaire1.version
        )
        .set(forscherHeader2)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 and delete the questionnaire', async function () {
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaires/' +
            addedQuestionnaire1.id +
            '/' +
            addedQuestionnaire1.version
        )
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(200);
      const result2 = await chai
        .request(apiAddress)
        .delete(
          '/questionnaires/' +
            addedQuestionnaire2.id +
            '/' +
            addedQuestionnaire2.version
        )
        .set(forscherHeader1)
        .send({});
      expect(result2).to.have.status(200);
      const result3 = await chai
        .request(apiAddress)
        .delete(
          '/questionnaires/' +
            addedQuestionnaireEmptyQuestion.id +
            '/' +
            addedQuestionnaireEmptyQuestion.version
        )
        .set(forscherHeader1)
        .send({});
      expect(result3).to.have.status(200);
      const result4 = await chai
        .request(apiAddress)
        .get('/questionnaires/' + addedQuestionnaire1.id)
        .set(forscherHeader1);
      expect(result4).to.have.status(404);
    });

    it('should delete a questionnaire and return HTTP 200', async function () {
      chai
        .request(apiAddress)
        .delete('/questionnaires/999998/1')
        .set(forscherHeader1)
        .send({})
        .then(async function (result) {
          const resultFromDatabse = await db.any(
            'SELECT id FROM user_files WHERE id=999999'
          );
          expect(result).to.have.status(200);
          expect(resultFromDatabse).to.be.empty;
        });
    });
  });
});
