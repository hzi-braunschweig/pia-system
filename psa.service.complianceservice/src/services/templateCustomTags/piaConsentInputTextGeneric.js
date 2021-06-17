const PiaConsentInputText = require('./piaConsentInputText');
const hashService = require('../../services/hashService');
const TemplateGenerationError = require('./errors/templateGenerationError');

class PiaConsentInputTextGeneric extends PiaConsentInputText {
  constructor(i18n) {
    super();
    this.i18n = i18n;
    this.tagName = 'pia-consent-input-text-generic';
  }

  convertNode(node) {
    const nameAttr = node.attrs.find((attr) => attr.name === 'name');
    if (!nameAttr) {
      throw new TemplateGenerationError(
        'No name attribute found for generic Text field.'
      );
    }
    const labelAttr = node.attrs.find((attr) => attr.name === 'label');
    if (!nameAttr) {
      throw new TemplateGenerationError(
        'No label attribute found for generic text field.'
      );
    }
    const value = 'genericText.' + hashService.createMd5Hash(nameAttr.value);
    const label = labelAttr.value;

    const i = node.parentNode.childNodes.findIndex((child) => child === node);
    node.parentNode.childNodes[i] = this.createTextField(value, label);
  }
}

module.exports = PiaConsentInputTextGeneric;
