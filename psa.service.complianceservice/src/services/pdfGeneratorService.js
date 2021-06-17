const hashService = require('./hashService');
const {
  MarkdownDocument,
  HtmlDocument,
  MarkdownCompiler,
  HtmlParser,
  HtmlSerializer,
  TemplateRenderer,
  PdfGenerator,
} = require('@pia/lib-templatepipeline');
const PiaConsentInputRadioSystem = require('./templateCustomTags/piaConsentInputRadioSystem');
const PiaConsentInputRadioGeneric = require('./templateCustomTags/piaConsentInputRadioGeneric');
const PiaConsentInputTextSystem = require('./templateCustomTags/piaConsentInputTextSystem');
const PiaConsentInputTextGeneric = require('./templateCustomTags/piaConsentInputTextGeneric');
const PiaConsentSwitchRadioSystem = require('./templateCustomTags/piaConsentSwitchRadioSystem');
const PiaConsentSwitchRadioGeneric = require('./templateCustomTags/piaConsentSwitchRadioGeneric');

const templateTags = require('./templateCustomTags/templateTagsList');

class PdfGeneratorService {
  /**
   * Transforms the compliance agree entry from the database to the needed entity format for the pipe
   * @param agree
   * @return {Promise<{genericCompliance: *, firstname: string, birthdate: string, complianceSamples: boolean, complianceApp: boolean, location: *, complianceBloodsamples: boolean, genericText: *, complianceLabresults: boolean, lastname: boolean, timestamp: string}>}
   */
  static async transformComplianceAgree(agree) {
    return {
      firstname: agree.firstname,
      lastname: agree.lastname,
      location: agree.location,
      birthdate:
        agree.birthdate &&
        new Date(agree.birthdate).toLocaleDateString('de-DE'),
      timestamp: new Date(agree.timestamp).toLocaleDateString('de-DE'),
      complianceApp: agree.complianceApp,
      complianceSamples: agree.complianceSamples,
      complianceBloodsamples: agree.complianceBloodsamples,
      complianceLabresults: agree.complianceLabresults,
      genericText: (await agree.getQuestionnaireTextCompliances()).reduce(
        (resultingObject, nextAttribute) => {
          resultingObject[
            hashService.createMd5Hash(nextAttribute.placeholder)
          ] = nextAttribute.value;
          return resultingObject;
        },
        {}
      ),
      genericCompliance: (await agree.getQuestionnaireCompliances()).reduce(
        (resultingObject, nextAttribute) => {
          resultingObject[
            hashService.createMd5Hash(nextAttribute.placeholder)
          ] = nextAttribute.value;
          return resultingObject;
        },
        {}
      ),
    };
  }

  /**
   * The main method of this module that creates a PDF
   * @param {Object} i18n
   * @param {Object} complianceAgree
   * @return {Promise<Buffer>}
   */
  static async createPdf(i18n, complianceAgree) {
    const transformedComplianceAgree =
      await PdfGeneratorService.transformComplianceAgree(complianceAgree);
    const parsedHtmlDocument = await new MarkdownDocument(
      complianceAgree.complianceText
    )
      .pipe(new MarkdownCompiler(templateTags))
      .pipe(new HtmlParser())
      .pipe(
        new PiaConsentInputRadioSystem(
          i18n,
          'pia-consent-input-radio-app',
          'complianceApp'
        )
      )
      .pipe(
        new PiaConsentInputRadioSystem(
          i18n,
          'pia-consent-input-radio-bloodsamples',
          'complianceBloodsamples'
        )
      )
      .pipe(
        new PiaConsentInputRadioSystem(
          i18n,
          'pia-consent-input-radio-labresults',
          'complianceLabresults'
        )
      )
      .pipe(
        new PiaConsentInputRadioSystem(
          i18n,
          'pia-consent-input-radio-samples',
          'complianceSamples'
        )
      )
      .pipe(new PiaConsentInputRadioGeneric(i18n))
      .pipe(
        new PiaConsentInputTextSystem(
          i18n,
          'pia-consent-input-text-firstname',
          'firstname',
          i18n.__('FIRSTNAME')
        )
      )
      .pipe(
        new PiaConsentInputTextSystem(
          i18n,
          'pia-consent-input-text-lastname',
          'lastname',
          i18n.__('LASTNAME')
        )
      )
      .pipe(
        new PiaConsentInputTextSystem(
          i18n,
          'pia-consent-input-text-location',
          'location',
          i18n.__('LOCATION')
        )
      )
      .pipe(
        new PiaConsentInputTextSystem(
          i18n,
          'pia-consent-input-text-birthdate',
          'birthdate',
          i18n.__('BIRTHDATE')
        )
      )
      .pipe(
        new PiaConsentInputTextSystem(
          i18n,
          'pia-consent-input-text-date',
          'timestamp',
          i18n.__('DATE')
        )
      )
      .pipe(new PiaConsentInputTextGeneric(i18n))
      .pipe(new PiaConsentSwitchRadioGeneric())
      .pipe(new PiaConsentSwitchRadioSystem())
      .pipe(new HtmlSerializer())
      .pipe(new TemplateRenderer(transformedComplianceAgree));

    const completeHtml =
      '<!DOCTYPE html><html lang="de"><head><title></title>' +
      '<style>' +
      'html { font-family: serif; font-size: 10pt; }' +
      '.wrapper { page-break-inside: avoid; }' +
      '.checkbox { margin-right: 10px; font-size: large; }' +
      '.checkbox-label { margin-right: 40px; }' +
      '.text { display: inline-block; border-bottom: 1px solid; min-width: 300px; padding: 2px 5px 2px 1px; }' +
      '.text-label { font-size: 70%; padding: 0 5px 2px 1px; }' +
      '</style></head><body>' +
      (await parsedHtmlDocument.htmlText) +
      '</body></html>';

    return new HtmlDocument(completeHtml).pipe(
      new PdfGenerator({
        margin: {
          bottom: '4cm', // minimum required for footer msg to display
          left: '2cm',
          right: '2cm',
          top: '3cm',
        },
        headerTemplate:
          '<div style="width: 100%; font-size: 8pt; font-family: serif; margin-top: 1.1cm; text-align: center">PIA</div>',
        footerTemplate:
          '<div style="width: 100%; font-size: 6.5pt; font-family: serif; margin-bottom: 1.6cm;">' +
          '<div style="margin: auto; width:12.6cm">' +
          '<hr>' +
          '<table style="width: 100%; border-collapse: collapse"><tr>' +
          '<td>' +
          i18n.__('CONSENT_ON') +
          ': ' +
          transformedComplianceAgree.timestamp +
          '</td>' +
          '<td>' +
          i18n.__('COMPLIANCE') +
          ' ' +
          complianceAgree.study +
          '</td>' +
          '<td style="text-align: right;">' +
          i18n.__('PAGE') +
          ' <span class="pageNumber"></span>/<span class="totalPages"></span></td>' +
          '</tr></table>' +
          '</div></div>',
        preferCSSPageSize: false,
      })
    ).pdf;
  }

  static async stop() {
    PdfGenerator.closeBrowser();
  }
}

module.exports = PdfGeneratorService;
