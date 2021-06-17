const PiaConsentInputRadio = require('./piaConsentInputRadio');

class PiaConsentInputRadioSystem extends PiaConsentInputRadio {
  constructor(i18n, tagName, value) {
    super(i18n);
    this.tagName = tagName;
    this.value = value;
  }

  convertNode(node) {
    const i = node.parentNode.childNodes.findIndex((child) => child === node);
    const checkbox = this.createCheckbox(this.value);
    checkbox.parentNode = node.parentNode;
    node.parentNode.childNodes[i] = checkbox;
  }
}

module.exports = PiaConsentInputRadioSystem;
