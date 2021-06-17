const PiaConsentSwitchRadio = require('./piaConsentSwitchRadio');
const TemplateGenerationError = require('./errors/templateGenerationError');

class PiaConsentSwitchRadioSystem extends PiaConsentSwitchRadio {
  constructor() {
    super();
    this.tagName = 'pia-consent-switch-radio-system';
  }

  convertNode(node) {
    const nameAttr = node.attrs.find((attr) => attr.name === 'name');
    if (!nameAttr) {
      throw new TemplateGenerationError(
        'No name attribute found for generic radio field.'
      );
    }
    let value;
    switch (nameAttr.value) {
      case 'app':
        value = 'complianceApp';
        break;
      case 'samples':
        value = 'complianceSamples';
        break;
      case 'bloodsamples':
        value = 'complianceBloodsamples';
        break;
      case 'labresults':
        value = 'complianceLabresults';
        break;
    }

    const i = node.parentNode.childNodes.findIndex((child) => child === node);
    const switchCase = this.createSwitchCase(node.childNodes, value);
    switchCase.parentNode = node.parentNode;
    node.parentNode.childNodes[i] = switchCase;
  }
}

module.exports = PiaConsentSwitchRadioSystem;
