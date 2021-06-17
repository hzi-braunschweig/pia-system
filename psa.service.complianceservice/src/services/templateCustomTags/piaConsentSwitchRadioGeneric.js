const PiaConsentSwitchRadio = require('./piaConsentSwitchRadio');
const hashService = require('../../services/hashService');
const TemplateGenerationError = require('./errors/templateGenerationError');

class PiaConsentSwitchRadioGeneric extends PiaConsentSwitchRadio {
  constructor() {
    super();
    this.tagName = 'pia-consent-switch-radio-generic';
  }

  convertNode(node) {
    const nameAttr = node.attrs.find((attr) => attr.name === 'name');
    if (!nameAttr) {
      throw new TemplateGenerationError(
        'No name attribute found for generic radio field.'
      );
    }
    const value =
      'genericCompliance.' + hashService.createMd5Hash(nameAttr.value);

    const i = node.parentNode.childNodes.findIndex((child) => child === node);
    const switchCase = this.createSwitchCase(node.childNodes, value);
    switchCase.parentNode = node.parentNode;
    node.parentNode.childNodes[i] = switchCase;
  }
}

module.exports = PiaConsentSwitchRadioGeneric;
