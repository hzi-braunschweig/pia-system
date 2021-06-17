const expect = require('chai').expect;
const pdfGeneratorService = require('./pdfGeneratorService');
const sandbox = require('sinon').createSandbox();

describe('pdfGeneratorService', () => {
  after(async () => {
    await pdfGeneratorService.stop();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  it('should create a simple pdf', async function () {
    this.timeout(5000);
    const getQuestionnaireTextCompliances = sandbox.stub().returns([]);
    const getQuestionnaireCompliances = sandbox.stub().returns([]);
    const translateStub = sandbox.stub();
    const i18n = { __: translateStub };
    const pdfBuffer = await pdfGeneratorService.createPdf(i18n, {
      complianceText: '',
      getQuestionnaireTextCompliances,
      getQuestionnaireCompliances,
    });
    expect(pdfBuffer).to.not.be.null;
    expect(getQuestionnaireTextCompliances.calledOnce).to.be.true;
    expect(getQuestionnaireCompliances.calledOnce).to.be.true;
    expect(translateStub.callCount).to.be.greaterThan(0);
  });

  it('should create a more complex pdf', async function () {
    this.timeout(5000);
    const translateStub = sandbox.stub();
    const i18n = { __: translateStub };
    const pdfBuffer = await pdfGeneratorService.createPdf(
      i18n,
      complianceAgree
    );
    expect(pdfBuffer).to.not.be.null;
    expect(translateStub.callCount).to.equal(6 * 4 + 5 + 3); // 6 radio + 5 static texts + 3 in footer
    require('fs').writeFileSync('./tests/reports/meine.pdf', pdfBuffer);
  });

  const cText = `
# Consent #

Is this consent for your child?
<pia-consent-input-radio-generic name="child"></pia-consent-input-radio-generic>

<pia-consent-switch-radio-generic name="child">
<pia-case value="false">
_Consent for me_

My firstname:
<pia-consent-input-text-firstname></pia-consent-input-text-firstname>

My lastname:
<pia-consent-input-text-lastname></pia-consent-input-text-lastname>

My birthdate:
<pia-consent-input-text-birthdate></pia-consent-input-text-birthdate>

</pia-case>
<pia-case value="true">
_Consent for my child_

The child's firstname:
<pia-consent-input-text-firstname></pia-consent-input-text-firstname>

The child's lastname:
<pia-consent-input-text-lastname></pia-consent-input-text-lastname>

The child's birthdate:
<pia-consent-input-text-birthdate></pia-consent-input-text-birthdate>
</pia-case>
</pia-consent-switch-radio-generic>

Lorem ipsum dolor sit amet, consetetur sadipscing elitr,

sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat,
sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.
Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod
tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.
At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren,
no sea takimata sanctus est Lorem ipsum dolor sit amet.

## Consent ##

Using the app:
<pia-consent-input-radio-app></pia-consent-input-radio-app>

Consent to nasal swabs:
<pia-consent-input-radio-samples></pia-consent-input-radio-samples>

Consent to laboratory results:
<pia-consent-input-radio-labresults></pia-consent-input-radio-labresults>
<pia-consent-switch-radio-system name="labresults">
<pia-case value="true">
Just a hint :)
</pia-case>
</pia-consent-switch-radio-system>

Spontaneous Questionnaires:
<pia-consent-input-radio-generic name="spontaneous"></pia-consent-input-radio-generic>

Evaluations:
<pia-consent-input-radio-generic name="evaluation"></pia-consent-input-radio-generic>

My address:
<pia-consent-input-text-generic name="address" label="Address"></pia-consent-input-text-generic>


<pia-consent-input-text-location></pia-consent-input-text-location>
<pia-consent-input-text-date></pia-consent-input-text-date>`;

  const complianceAgree = {
    complianceText: cText,
    firstname: 'Max',
    lastname: 'Mustermann',
    birthdate: '1990-01-01',
    location: 'Bonn',
    complianceApp: true,
    complianceSamples: true,
    complianceBloodsamples: false,
    complianceLabresults: true,
    timestamp: '2020-01-01T12:30:00.000Z',
    getQuestionnaireTextCompliances() {
      return [
        {
          placeholder: 'address',
          value: '12345 Bonn, Nameless Street 34',
        },
      ];
    },
    getQuestionnaireCompliances() {
      return [
        {
          placeholder: 'spontaneous',
          value: true,
        },
        {
          placeholder: 'evaluation',
          value: false,
        },
        {
          placeholder: 'child',
          value: true,
        },
      ];
    },
  };
});
