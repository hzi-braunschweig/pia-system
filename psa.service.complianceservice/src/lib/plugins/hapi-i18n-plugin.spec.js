const expect = require('chai').expect;
const sinon = require('sinon');
const hapiI18nPlugin = require('./hapi-i18n-plugin');
describe('hapi i18n plugin', () => {
  it('should add a i18n instance to a request', function () {
    const options = {
      locales: ['de-DE'],
    };
    let extPoint = null,
      extFunction = null;

    function fakeExt(extPointx, extFunctionx) {
      extPoint = extPointx;
      extFunction = extFunctionx;
    }

    const server = {
      ext: sinon.stub().callsFake(fakeExt),
    };
    hapiI18nPlugin.plugin.register(server, options);
    expect(server.ext.calledOnce).to.be.true;
    expect(extPoint).to.equal('onPreHandler');
    const request = {};
    const h = { continue: null };
    const returned = extFunction(request, h);
    expect(returned).to.be.null;
    expect(request.i18n).to.be.a('object');
    expect(request.i18n.__).to.be.a('function');
    expect(request.i18n.__('HELLO')).to.equal('HELLO');
    expect(request.i18n.getLocale()).to.equal('de-DE');
  });
});
