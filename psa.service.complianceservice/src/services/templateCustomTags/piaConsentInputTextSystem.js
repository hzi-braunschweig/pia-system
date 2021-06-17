const PiaConsentInputText = require('./piaConsentInputText');

class PiaConsentInputTextSystem extends PiaConsentInputText {
  constructor(i18n, tagName, value, label) {
    super();
    this.i18n = i18n;
    this.tagName = tagName;
    this.label = label;
    this.value = value;
  }

  convertNode(node) {
    const i = node.parentNode.childNodes.findIndex((child) => child === node);
    node.parentNode.childNodes[i] = this.createTextField(
      this.value,
      this.label
    );
  }
}

module.exports = PiaConsentInputTextSystem;
