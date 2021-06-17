const { CustomTagConverter } = require('@pia/lib-templatepipeline');
const { parseFragment } = require('parse5');

class PiaConsentInputText extends CustomTagConverter {
  createTextField(value, label) {
    return parseFragment(
      `<div class="wrapper"><span class="text">{{ ${value} }}</span><br><span class="text-label">${label}</span></div><br>`
    ).childNodes[0];
  }
}

module.exports = PiaConsentInputText;
