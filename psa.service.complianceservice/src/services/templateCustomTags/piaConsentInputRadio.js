const { CustomTagConverter } = require('@pia/lib-templatepipeline');
const { parseFragment } = require('parse5');

class PiaConsentInputRadio extends CustomTagConverter {
  constructor(i18n) {
    super();
    this.i18n = i18n;
  }

  createCheckbox(value) {
    return parseFragment(`<div class="wrapper">
    {{#${value}}}
      <span class="checkbox">&#9746;</span>
      <span class="checkbox-label">${this.i18n.__('YES')}</span>
      <span class="checkbox">&#9744;</span>
      <span class="checkbox-label">${this.i18n.__('NO')}</span>
    {{/${value}}}
    {{^${value}}}
      <span class="checkbox">&#9744;</span>
      <span class="checkbox-label">${this.i18n.__('YES')}</span>
      <span class="checkbox">&#9746;</span>
      <span class="checkbox-label">${this.i18n.__('NO')}</span>
    {{/${value}}}
  </div>`).childNodes[0];
  }
}

module.exports = PiaConsentInputRadio;
