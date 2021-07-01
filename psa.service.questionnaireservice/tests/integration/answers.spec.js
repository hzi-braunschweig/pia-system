const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const { setup, cleanup } = require('./answers.spec.data/setup.helper');

const { db } = require('../../src/db');

const secretOrPrivateKey = require('../secretOrPrivateKey');
const JWT = require('jsonwebtoken');

const server = require('../../src/server');

const apiAddress = 'http://localhost:' + process.env.PORT + '/questionnaire';

const probandSession1 = { id: 1, role: 'Proband', username: 'QTestProband1' };
const probandSession2 = { id: 1, role: 'Proband', username: 'QTestProband2' };
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
const utSession = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersuchungsteam',
};
const utSession2 = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersuchungsteam2',
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
const forscherToken1 = JWT.sign(forscherSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken2 = JWT.sign(forscherSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const utToken = JWT.sign(utSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const utToken2 = JWT.sign(utSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const invalidHeader = { authorization: invalidToken };
const probandHeader1 = { authorization: probandToken1 };
const probandHeader2 = { authorization: probandToken2 };
const forscherHeader1 = { authorization: forscherToken1 };
const forscherHeader2 = { authorization: forscherToken2 };
const utHeader = { authorization: utToken };
const utHeader2 = { authorization: utToken2 };

const validAnswers = {
  answers: [
    {
      question_id: 99991,
      answer_option_id: 99991,
      value: 'Ja',
    },
    {
      question_id: 99992,
      answer_option_id: 99992,
      value: 'Gut',
    },
  ],
};

const validUpdatedAnswers = {
  answers: [
    {
      question_id: 99991,
      answer_option_id: 99991,
      value: 'Nein',
    },
    {
      question_id: 99992,
      answer_option_id: 99993,
      value: 'Schlecht',
    },
  ],
};

const invalidAnswers = {
  answers: [
    {
      wrongField: 'willnotwork',
      question_id: 99991,
      answer_option_id: 99991,
      value: 'Ja',
    },
    {
      question_id: 99992,
      answer_option_id: 99992,
      value: 'Gut',
    },
  ],
};

const emptyAnswers = {
  answers: [
    {
      question_id: 99991,
      answer_option_id: 99991,
      value: '',
    },
    {
      question_id: 99992,
      answer_option_id: 99992,
      value: '',
    },
    {
      question_id: 99992,
      answer_option_id: 99993,
      value: '',
    },
  ],
};

const updateNdeleteAnswers = {
  answers: [
    {
      question_id: 99991,
      answer_option_id: 99991,
      value: '',
    },
    {
      question_id: 99992,
      answer_option_id: 99992,
      value: 'Nein',
    },
    {
      question_id: 99992,
      answer_option_id: 99993,
      value: '',
    },
  ],
};

const resetAnswers = {
  answers: [
    {
      question_id: 99991,
      answer_option_id: 99991,
      value: 'Nein',
    },
    {
      question_id: 99992,
      answer_option_id: 99992,
      value: 'Gut',
    },
    {
      question_id: 99992,
      answer_option_id: 99993,
      value: 'Schlecht',
    },
  ],
};

const validLabresultAnswer = {
  answers: [
    {
      question_id: 99992,
      answer_option_id: 99994,
      value: 'ANSWERTEST-1234570',
    },
  ],
};

const utAnswer = {
  answers: [
    {
      question_id: 7777771,
      answer_option_id: 7777771,
      value: JSON.stringify({
        file_name: 'file.dat',
        data: 'aaaaaa',
      }),
    },
  ],
  version: 1,
};

const pngImageAsBase64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAIAAABMXPacAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTExIDc5LjE1ODMyNSwgMjAxNS8wOS8xMC0wMToxMDoyMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjM3NzZGODAwMEQyMzExRTZBRkFBRkFEQkQxREREMzMwIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjM3NzZGODAxMEQyMzExRTZBRkFBRkFEQkQxREREMzMwIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6Mzc3NkY3RkUwRDIzMTFFNkFGQUFGQURCRDFEREQzMzAiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6Mzc3NkY3RkYwRDIzMTFFNkFGQUFGQURCRDFEREQzMzAiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6rxGS6AAAB+0lEQVR42uzdzUrDQBiG0UmtG7GF+gfijSh4+8VbcWG1teBGMU4QXLgrecXRnmfR5ZDOSZosPtKuL/rNJrYAAAABACAAAAQAgAAAEAAAAgBAAAAIAAABACAA/7Jpu4fWdWU2K5PRp0jfl+fn4RPAbtXdXy7LxcXYddbrcnNTHh8B7H4FXF6W09Ox6xwdBS6jPb0HvL62soibsKcgAQAgAAAEAIAAABAAAAIAQAAACAAAAQAgAAAEAECkt7cWl0oXmozrunJ8HB5Am8+HZSPHdnISng2tq223kTW7PrVZy2U5O0t+ybpx5+cB1Pf38vAwfAbbbMrt7bBsK1dA3aarq7JYNPkrOwlM+H5rNisHB43dA9oewQxXv2zoN81TkKcgAAIAQAAACAAAAQAgAAAEAIAAABAAAPoTANPpHm1b7suGFur7slplxni+qqvN55l3xm024bmg3IKhuaC6WYtFfjDr7i7zzrjr6+H8CFZ3/+kpMmuUuwLib8V7eclMU9Vju78fzlk34d06PGxxKU9BnoIEAIAAABAAAAIAQAAACAAAAQAgAAAEAIAAABAAACOLjGC2PbTa8MF9TtuN3771utk/Ey6x2dAfObRu+C/byHDuahV+Z9xeALgHCAAAAQAgAAAEAIAAABAAAAIAQAAACAAAAQAgAH+3DwEGAE04akuvIx7eAAAAAElFTkSuQmCCMTQxOQ==';
const pdfFileAsBase64 =
  'data:application/pdf;base64,JVBERi0xLjMNCiXi48/TDQoNCjEgMCBvYmoNCjw8DQovVHlwZSAvQ2F0YWxvZw0KL091dGxpbmVzIDIgMCBSDQovUGFnZXMgMyAwIFINCj4+DQplbmRvYmoNCg0KMiAwIG9iag0KPDwNCi9UeXBlIC9PdXRsaW5lcw0KL0NvdW50IDANCj4+DQplbmRvYmoNCg0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDINCi9LaWRzIFsgNCAwIFIgNiAwIFIgXSANCj4+DQplbmRvYmoNCg0KNCAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDMgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDkgMCBSIA0KPj4NCi9Qcm9jU2V0IDggMCBSDQo+Pg0KL01lZGlhQm94IFswIDAgNjEyLjAwMDAgNzkyLjAwMDBdDQovQ29udGVudHMgNSAwIFINCj4+DQplbmRvYmoNCg0KNSAwIG9iag0KPDwgL0xlbmd0aCAxMDc0ID4+DQpzdHJlYW0NCjIgSg0KQlQNCjAgMCAwIHJnDQovRjEgMDAyNyBUZg0KNTcuMzc1MCA3MjIuMjgwMCBUZA0KKCBBIFNpbXBsZSBQREYgRmlsZSApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY4OC42MDgwIFRkDQooIFRoaXMgaXMgYSBzbWFsbCBkZW1vbnN0cmF0aW9uIC5wZGYgZmlsZSAtICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNjY0LjcwNDAgVGQNCigganVzdCBmb3IgdXNlIGluIHRoZSBWaXJ0dWFsIE1lY2hhbmljcyB0dXRvcmlhbHMuIE1vcmUgdGV4dC4gQW5kIG1vcmUgKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA2NTIuNzUyMCBUZA0KKCB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDYyOC44NDgwIFRkDQooIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNjE2Ljg5NjAgVGQNCiggdGV4dC4gQW5kIG1vcmUgdGV4dC4gQm9yaW5nLCB6enp6ei4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNjA0Ljk0NDAgVGQNCiggbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDU5Mi45OTIwIFRkDQooIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNTY5LjA4ODAgVGQNCiggQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA1NTcuMTM2MCBUZA0KKCB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBFdmVuIG1vcmUuIENvbnRpbnVlZCBvbiBwYWdlIDIgLi4uKSBUag0KRVQNCmVuZHN0cmVhbQ0KZW5kb2JqDQoNCjYgMCBvYmoNCjw8DQovVHlwZSAvUGFnZQ0KL1BhcmVudCAzIDAgUg0KL1Jlc291cmNlcyA8PA0KL0ZvbnQgPDwNCi9GMSA5IDAgUiANCj4+DQovUHJvY1NldCA4IDAgUg0KPj4NCi9NZWRpYUJveCBbMCAwIDYxMi4wMDAwIDc5Mi4wMDAwXQ0KL0NvbnRlbnRzIDcgMCBSDQo+Pg0KZW5kb2JqDQoNCjcgMCBvYmoNCjw8IC9MZW5ndGggNjc2ID4+DQpzdHJlYW0NCjIgSg0KQlQNCjAgMCAwIHJnDQovRjEgMDAyNyBUZg0KNTcuMzc1MCA3MjIuMjgwMCBUZA0KKCBTaW1wbGUgUERGIEZpbGUgMiApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY4OC42MDgwIFRkDQooIC4uLmNvbnRpbnVlZCBmcm9tIHBhZ2UgMS4gWWV0IG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA2NzYuNjU2MCBUZA0KKCBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY2NC43MDQwIFRkDQooIHRleHQuIE9oLCBob3cgYm9yaW5nIHR5cGluZyB0aGlzIHN0dWZmLiBCdXQgbm90IGFzIGJvcmluZyBhcyB3YXRjaGluZyApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY1Mi43NTIwIFRkDQooIHBhaW50IGRyeS4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA2NDAuODAwMCBUZA0KKCBCb3JpbmcuICBNb3JlLCBhIGxpdHRsZSBtb3JlIHRleHQuIFRoZSBlbmQsIGFuZCBqdXN0IGFzIHdlbGwuICkgVGoNCkVUDQplbmRzdHJlYW0NCmVuZG9iag0KDQo4IDAgb2JqDQpbL1BERiAvVGV4dF0NCmVuZG9iag0KDQo5IDAgb2JqDQo8PA0KL1R5cGUgL0ZvbnQNCi9TdWJ0eXBlIC9UeXBlMQ0KL05hbWUgL0YxDQovQmFzZUZvbnQgL0hlbHZldGljYQ0KL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcNCj4+DQplbmRvYmoNCg0KMTAgMCBvYmoNCjw8DQovQ3JlYXRvciAoUmF2ZSBcKGh0dHA6Ly93d3cubmV2cm9uYS5jb20vcmF2ZVwpKQ0KL1Byb2R1Y2VyIChOZXZyb25hIERlc2lnbnMpDQovQ3JlYXRpb25EYXRlIChEOjIwMDYwMzAxMDcyODI2KQ0KPj4NCmVuZG9iag0KDQp4cmVmDQowIDExDQowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMTkgMDAwMDAgbg0KMDAwMDAwMDA5MyAwMDAwMCBuDQowMDAwMDAwMTQ3IDAwMDAwIG4NCjAwMDAwMDAyMjIgMDAwMDAgbg0KMDAwMDAwMDM5MCAwMDAwMCBuDQowMDAwMDAxNTIyIDAwMDAwIG4NCjAwMDAwMDE2OTAgMDAwMDAgbg0KMDAwMDAwMjQyMyAwMDAwMCBuDQowMDAwMDAyNDU2IDAwMDAwIG4NCjAwMDAwMDI1NzQgMDAwMDAgbg0KDQp0cmFpbGVyDQo8PA0KL1NpemUgMTENCi9Sb290IDEgMCBSDQovSW5mbyAxMCAwIFINCj4+DQoNCnN0YXJ0eHJlZg0KMjcxNA0KJSVFT0YNCg==';

const utAnswer2 = {
  answers: [
    {
      question_id: 7777771,
      answer_option_id: 7777771,
      value: JSON.stringify({
        file_name: 'file.pdf',
        data: pdfFileAsBase64,
      }),
    },
  ],
  version: 1,
};

const utUpdateAnswer = {
  answers: [
    {
      question_id: 7777771,
      answer_option_id: 7777771,
      value: JSON.stringify({
        file_name: 'file_new.pdf',
        data: pdfFileAsBase64,
      }),
    },
  ],
  date_of_release: new Date().toDateString(),
  version: 2,
};

const validAnswerOfTypeImage2 = {
  answers: [
    {
      question_id: 99992,
      answer_option_id: 99980,
      value: JSON.stringify({
        file_name: 'image.png',
        data: pngImageAsBase64,
      }),
    },
  ],
};

const validAnswerOfTypeImage = {
  answers: [
    {
      question_id: 99992,
      answer_option_id: 99995,
      value: JSON.stringify({
        file_name: 'image.png',
        data: pngImageAsBase64,
      }),
    },
  ],
};

describe('/questionnaireInstances/{id}/answers', function () {
  before(async function () {
    this.timeout(15000);
    await setup();
    await server.init();
  });

  after(async function () {
    await server.stop();
    await cleanup();
  });

  describe('POST /questionnaireInstances/id/answers', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/99996/answers')
        .set(invalidHeader)
        .send(validAnswers);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 400 if the payload is invalid', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/99996/answers')
        .set(probandHeader1)
        .send(invalidAnswers);
      expect(result).to.have.status(400);
    });

    it('should return HTTP 403 if a Proband tries to post answers for inactive QI', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/99997/answers')
        .set(probandHeader1)
        .send(validAnswers);

      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a UT tries to post answers for none UT QI', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/99996/answers')
        .set(utHeader)
        .send(validAnswers);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a UT tries to post answers for UT QI that is in wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/7777771/answers')
        .set(utHeader2)
        .send(utAnswer);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 with the posted answers if a Proband tries for an active QI', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/99996/answers')
        .set(probandHeader1)
        .send(validAnswers);
      expect(result).to.have.status(200);
      expect(result.body.answers.length).to.equal(2);
      expect(result.body.answers[0].value).to.equal('Ja');
      expect(result.body.answers[0].versioning).to.equal(1);
      expect(result.body.answers[0].date_of_release).to.equal(null);
      expect(result.body.answers[0].releasing_person).to.equal(null);
      expect(result.body.answers[1].value).to.equal('Gut');
      expect(result.body.links.self.href).to.equal(
        '/questionnaireInstances/99996/answers'
      );
    });

    it('should return HTTP 403 if a Proband tries to update answers for nonexisting QI', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/88888/answers')
        .set(probandHeader1)
        .send(validAnswers);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a Proband tries to update answers for QI that is not assigned to him', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/99996/answers')
        .set(probandHeader2)
        .send(validUpdatedAnswers);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a Forscher tries to update answers', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/99996/answers')
        .set(forscherHeader1)
        .send(validUpdatedAnswers);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 with the updated answers if a Proband tries to update sample id answers for existing lab result', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/99998/answers')
        .set(probandHeader1)
        .send(validLabresultAnswer);
      expect(result).to.have.status(200);
    });

    it('should return HTTP 200 with the updated answers if a Proband tries to update answers for an active QI', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/99996/answers')
        .set(probandHeader1)
        .send(validUpdatedAnswers);
      expect(result).to.have.status(200);
      expect(result.body.answers.length).to.equal(2);
      expect(result.body.answers[0].value).to.equal('Nein');
      expect(result.body.answers[0].versioning).to.equal(1);
      expect(result.body.answers[0].date_of_release).to.equal(null);
      expect(result.body.answers[0].releasing_person).to.equal(null);
      expect(result.body.answers[1].value).to.equal('Schlecht');
      expect(result.body.links.self.href).to.equal(
        '/questionnaireInstances/99996/answers'
      );
    });

    it('should return HTTP 200 with the updated answers if a Proband tries to update answers for an in_progress QI', async function () {
      await db.none(
        'UPDATE questionnaire_instances SET status=$1 WHERE id=$2',
        ['in_progress', 99996]
      );
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/99996/answers')
        .set(probandHeader1)
        .send(validUpdatedAnswers);
      expect(result).to.have.status(200);
      expect(result.body.answers.length).to.equal(2);
      expect(result.body.answers[0].value).to.equal('Nein');
      expect(result.body.answers[1].value).to.equal('Schlecht');
      expect(result.body.links.self.href).to.equal(
        '/questionnaireInstances/99996/answers'
      );
    });

    describe('do not delete on empty string', function () {
      // Reset the deleted answers
      afterEach(async function () {
        await chai
          .request(apiAddress)
          .post('/questionnaireInstances/99999/answers')
          .set(probandHeader1)
          .send(resetAnswers);
      });

      it('should return HTTP 200 and the answers of the question should be empty and not deleted', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/questionnaireInstances/99999/answers')
          .set(probandHeader1)
          .send(emptyAnswers);
        expect(result).to.have.status(200);
        const result2 = await chai
          .request(apiAddress)
          .get('/questionnaireInstances/99999/answers')
          .set(probandHeader1);
        expect(result2.body.answers.length).to.equal(3);
        expect(result2.body.answers[0].value).to.equal('');
        expect(result2.body.answers[1].value).to.equal('');
        expect(result2.body.answers[2].value).to.equal('');
      });

      it('should return HTTP 200 and do both update as well as empty answers', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/questionnaireInstances/99999/answers')
          .set(probandHeader1)
          .send(updateNdeleteAnswers);
        expect(result).to.have.status(200);
        const result2 = await chai
          .request(apiAddress)
          .get('/questionnaireInstances/99999/answers')
          .set(probandHeader1);
        expect(result2.body.answers.length).to.equal(3);
        expect(result2.body.answers[0].value).to.equal('');
        expect(result2.body.answers[1].value).to.equal('Nein');
        expect(result2.body.answers[2].value).to.equal('');
      });

      it('should return HTTP 200 and empty the answer of type image and delete the image', async function () {
        const deleteAnswerOfTypeImage = {
          answers: [
            {
              question_id: 99992,
              answer_option_id: 99982,
              value: '',
            },
          ],
        };
        const result = await chai
          .request(apiAddress)
          .post('/questionnaireInstances/99996/answers')
          .set(probandHeader1)
          .send(deleteAnswerOfTypeImage);
        const resultFromDatabase = await db.any(
          'SELECT id FROM user_files WHERE id=$1',
          ['99995']
        );

        expect(resultFromDatabase).to.be.an('array').that.is.empty;
        expect(result).to.have.status(200);
      });
    });

    describe('after released twice', function () {
      after(async function () {
        await db.none(
          'UPDATE questionnaire_instances SET status= $1 WHERE id=$2',
          ['released_once', 99996]
        );
      });

      it('should return HTTP 403 if a Proband tries to update answers for QI that is released_twice', async function () {
        await chai
          .request(apiAddress)
          .put('/questionnaireInstances/99996')
          .set(probandHeader1)
          .send({
            status: 'released_once',
            progress: 90,
          });
        await chai
          .request(apiAddress)
          .put('/questionnaireInstances/99996')
          .set(probandHeader1)
          .send({
            status: 'released_twice',
            progress: 100,
          });
        const result = await chai
          .request(apiAddress)
          .post('/questionnaireInstances/99996/answers')
          .set(probandHeader1)
          .send(validUpdatedAnswers);
        expect(result).to.have.status(403);
      });
      it('should return HTTP 200 with the correct QI if a Proband tries and QI has status released_twice', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/questionnaireInstances/99996')
          .set(probandHeader1);
        expect(result).to.have.status(200);
        expect(result.body.user_id).to.equal('QTestProband1');
        expect(result.body.status).to.equal('released_twice');
        expect(result.body.date_of_release_v1).to.not.equal(null);
        expect(result.body.date_of_release_v2).to.not.equal(null);
        expect(result.body.links.self).to.deep.equal({
          href: '/questionnaireInstances/99996',
        });
      });
    });
  });

  describe('POST /questionnaireInstances/{id}/answers', function () {
    it('should return HTTP 200 with the posted answer if a UT tries for an active QI that is for UTs', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/7777771/answers')
        .set(utHeader)
        .send(utAnswer2);
      expect(result).to.have.status(200);
      expect(result.body.answers.length).to.equal(1);
      expect(isNaN(result.body.answers[0].value)).to.equal(false);
      expect(result.body.answers[0].versioning).to.equal(1);
      expect(result.body.answers[0].date_of_release).to.equal(null);
      expect(result.body.answers[0].releasing_person).to.equal(null);
      expect(result.body.links.self.href).to.equal(
        '/questionnaireInstances/7777771/answers'
      );
    });

    it('should return HTTP 200 with the updated answers if a UT tries to update answers for an active QI that is for UTs', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/7777771/answers')
        .set(utHeader)
        .send(utUpdateAnswer);
      expect(result).to.have.status(200);
      expect(result.body.answers.length).to.equal(1);
      expect(isNaN(result.body.answers[0].value)).to.equal(false);
      expect(result.body.answers[0].versioning).to.equal(2);
      expect(result.body.answers[0].date_of_release).to.not.equal(null);
      expect(result.body.answers[0].releasing_person).to.equal(
        'QTestUntersuchungsteam'
      );
      expect(result.body.links.self.href).to.equal(
        '/questionnaireInstances/7777771/answers'
      );
    });

    it('should return HTTP 200 if answer type is image and save name of the image ', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/99996/answers')
        .set(probandHeader1)
        .send(validAnswerOfTypeImage);
      expect(result).to.have.status(200);
      const resultFromDatabase = await db.one(
        'SELECT file_name FROM user_files WHERE id=$1',
        [result.body.answers[0].value]
      );
      expect(resultFromDatabase.file_name.toString()).to.equal('image.png');
    });

    it('should return HTTP 200 with the updated answers if a UT tries to update answers for an in_progress QI that is for UTs', async function () {
      await db.none(
        'UPDATE questionnaire_instances SET status=$1 WHERE id=$2',
        ['in_progress', 7777771]
      );
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/7777771/answers')
        .set(utHeader)
        .send(utAnswer2);
      expect(result).to.have.status(200);
      expect(result.body.answers.length).to.equal(1);
      expect(isNaN(result.body.answers[0].value)).to.equal(false);
      expect(result.body.links.self.href).to.equal(
        '/questionnaireInstances/7777771/answers'
      );
      await db.none(
        'UPDATE questionnaire_instances SET status=$1 WHERE id=$2',
        ['active', 7777771]
      );
    });

    it('should return HTTP 200 if answer type is image', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/99996/answers')
        .set(probandHeader1)
        .send(validAnswerOfTypeImage);
      expect(result).to.have.status(200);
    });

    it('should return HTTP 200 if answer type is image and update the answer', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/99996/answers')
        .set(probandHeader1)
        .send(validAnswerOfTypeImage2);
      expect(result).to.have.status(200);
      const resultFromDatabase = await db.one(
        'SELECT id FROM user_files WHERE id=$1',
        [result.body.answers[0].value]
      );
      const newName = await db.one(
        'SELECT file_name FROM user_files WHERE id=$1',
        [result.body.answers[0].value]
      );

      expect(resultFromDatabase.id.toString()).to.equal(
        result.body.answers[0].value
      );
      expect(newName.file_name.toString()).to.equal('image.png');
    });
  });

  describe('GET /questionnaireInstances/id/answers', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/99996/answers')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 if the QI id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/88888/answers')
        .set(forscherHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if the QI is not assigned to Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/99996/answers')
        .set(probandHeader2);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if the QIs study is not assigned to Forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/99996/answers')
        .set(forscherHeader2);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if the QIs study is not assigned to UT even though the QI is for UTs', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/7777771/answers')
        .set(utHeader2);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a UT tries for QI that is not for UTs', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/99996/answers')
        .set(utHeader);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a Forscher tries for active QI', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/99998/answers')
        .set(forscherHeader1);
      expect(result).to.have.status(403);
    });
  });

  describe('GET /questionnaireInstances/id/answersHistorical', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/99996/answersHistorical')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 if the QI id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/88888/answersHistorical')
        .set(forscherHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/99996/answersHistorical')
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/99996/answersHistorical')
        .set(forscherHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if the QIs study is not assigned to UT even though the QI is for UTs', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/7777771/answersHistorical')
        .set(utHeader2);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a UT tries for QI that is not for UTs', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/99996/answersHistorical')
        .set(utHeader);
      expect(result).to.have.status(403);
    });
  });

  describe('GET /questionnaireInstances/{id}/answers', function () {
    it('should return HTTP 200 with the correct answers if the correct Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/99996/answers')
        .set(probandHeader1);
      expect(result).to.have.status(200);
      expect(result.body.answers.length).to.equal(2);
      expect(result.body.links.self.href).to.equal(
        '/questionnaireInstances/99996/answers'
      );
    });

    it('should return HTTP 200 with the correct answers if the correct UT tries for QI that is for UTs', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/7777771/answers')
        .set(utHeader);
      expect(result).to.have.status(200);
      expect(result.body.answers.length).to.equal(1);
      expect(result.body.links.self.href).to.equal(
        '/questionnaireInstances/7777771/answers'
      );
    });

    it('should return HTTP 200 with the correct answers history  if the correct UT tries for QI that is for UTs', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/7777771/answersHistorical')
        .set(utHeader);
      expect(result).to.have.status(200);
      expect(result.body.answers.length).to.equal(2);
      expect(result.body.answers[0].value).to.equal('file.pdf');
      expect(result.body.answers[0].versioning).to.equal(1);
      expect(result.body.answers[1].value).to.equal('file_new.pdf');
      expect(result.body.answers[1].versioning).to.equal(2);
      expect(result.body.links.self.href).to.equal(
        '/questionnaireInstances/7777771/answers'
      );
    });
  });

  describe('DELETE /questionnaireInstances/id/answers/answer_option_id', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      await chai
        .request(apiAddress)
        .post('/questionnaireInstances/99998/answers')
        .set(probandHeader1)
        .send(validAnswers);
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaireInstances/99998/answers/' +
            validAnswers.answers[0].answer_option_id
        )
        .set(invalidHeader)
        .send('');
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 and delete nothing if the answer_option_id is wrong', async function () {
      const result1 = await chai
        .request(apiAddress)
        .delete('/questionnaireInstances/99998/answers/82749823798')
        .set(probandHeader1)
        .send('');
      expect(result1).to.have.status(403);
      const result2 = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/99998/answers')
        .set(probandHeader1);
      expect(result2.body.answers.length).to.equal(3);
    });

    it('should return HTTP 200 and empty the answer but also delete the image', async function () {
      await db.none(
        'UPDATE questionnaire_instances SET status=$1 WHERE id=$2',
        ['active', 99996]
      );
      const result = await chai
        .request(apiAddress)
        .delete('/questionnaireInstances/99996/answers/99981')
        .set(probandHeader1)
        .send('');
      const imgresult = await db.any('SELECT id FROM user_files WHERE id=$1', [
        '99999',
      ]);
      const answerResult = await db.one(
        'SELECT value FROM answers WHERE questionnaire_instance_id=$1 AND answer_option_id=$2',
        [99996, 99981]
      );

      expect(imgresult).to.be.an('array').that.is.empty;
      expect(answerResult.value).to.equal('');
      expect(result).to.have.status(200);
    });

    it('should return HTTP 200 and delete the answer if a Proband tries for an active QI', async function () {
      const result1 = await chai
        .request(apiAddress)
        .delete(
          '/questionnaireInstances/99998/answers/' +
            validAnswers.answers[0].answer_option_id
        )
        .set(probandHeader1)
        .send('');
      expect(result1).to.have.status(200);
      const result2 = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/99998/answers')
        .set(probandHeader1);
      expect(result2.body.answers.length).to.equal(3);
    });

    it('should return HTTP 403 if a Proband tries to delete an answer for nonexisting QI', async function () {
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaireInstances/88888/answers/' +
            validAnswers.answers[0].answer_option_id
        )
        .set(probandHeader1)
        .send('');
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a Proband tries to delete an answer for QI that is not assigned to him', async function () {
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaireInstances/99996/answers/' +
            validAnswers.answers[0].answer_option_id
        )
        .set(probandHeader2)
        .send('');
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a Forscher tries to delete answers', async function () {
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaireInstances/99996/answers/' +
            validAnswers.answers[0].answer_option_id
        )
        .set(forscherHeader1)
        .send('');
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a Proband tries to delete an answer for QI that is released_twice', async function () {
      await chai
        .request(apiAddress)
        .put('/questionnaireInstances/99996')
        .set(probandHeader1)
        .send({
          status: 'released_once',
          progress: 90,
        });
      await chai
        .request(apiAddress)
        .put('/questionnaireInstances/99996')
        .set(probandHeader1)
        .send({
          status: 'released_twice',
          progress: 100,
        });
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaireInstances/99996/answers/' +
            validAnswers.answers[0].answer_option_id
        )
        .set(probandHeader1)
        .send('');
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a UT tries to delete an answer for QI that is not for UTs', async function () {
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaireInstances/99998/answers/' +
            validAnswers.answers[0].answer_option_id
        )
        .set(utHeader)
        .send('');
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a UT tries to delete an answer for QI that is not in his study', async function () {
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaireInstances/7777771/answers/' +
            utAnswer.answers[0].answer_option_id
        )
        .set(utHeader2)
        .send('');
      expect(result).to.have.status(403);
    });
  });

  describe('DELETE /questionnaireInstances/{id}/answers', function () {
    it('should return HTTP 200 and delete the last version of the answer if a UT tries to delete an answer for QI that is for UTs', async function () {
      const result1 = await chai
        .request(apiAddress)
        .delete(
          '/questionnaireInstances/7777771/answers/' +
            utAnswer2.answers[0].answer_option_id
        )
        .set(utHeader)
        .send('');
      expect(result1).to.have.status(200);
      const result2 = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/7777771/answers')
        .set(utHeader);
      expect(result2.body.answers.length).to.equal(1);
    });
  });

  describe('/answertypes', function () {
    describe('GET /answertypes', function () {
      it('should return HTTP 401 when the token is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/answertypes')
          .set(invalidHeader);
        expect(result).to.have.status(401);
      });

      it('should return HTTP 200 with correct answertypes', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/answertypes')
          .set(probandHeader1);
        expect(result).to.have.status(200);
        expect(result.body.answertypes.length).to.equal(10);
        expect(result.body.answertypes[0].type).to.equal('array_single');
        expect(result.body.answertypes[1].type).to.equal('array_multi');
        expect(result.body.answertypes[2].type).to.equal('number');
        expect(result.body.answertypes[3].type).to.equal('string');
        expect(result.body.answertypes[4].type).to.equal('date');
        expect(result.body.answertypes[5].type).to.equal('sample');
        expect(result.body.answertypes[6].type).to.equal('pzn');
        expect(result.body.answertypes[7].type).to.equal('image');
        expect(result.body.answertypes[8].type).to.equal('date_time');
        expect(result.body.answertypes[9].type).to.equal('file');
        expect(result.body.links.self.href).to.equal('/answertypes');
      });
    });

    describe('GET /answertypes/id', function () {
      it('should return HTTP 401 when the token is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/answertypes/' + 1)
          .set(invalidHeader);
        expect(result).to.have.status(401);
      });

      it('should return HTTP 404 when the id is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/answertypes/' + 999)
          .set(probandHeader1);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 200 with correct answertype', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/answertypes/' + 1)
          .set(probandHeader1);
        expect(result).to.have.status(200);
        expect(result.body.type).to.equal('array_single');
        expect(result.body.links.self.href).to.equal('/answertypes/1');
      });
      it('should return for answertype equal "date_time", if id=9', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/answertypes/' + 9)
          .set(probandHeader1);
        expect(result).to.have.status(200);
        expect(result.body.type).to.equal('date_time');
      });
    });
  });
});
