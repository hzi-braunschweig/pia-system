/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import * as hapiI18nPlugin from './index';
import { HapiI18nPluginOptions } from './index';
import { capture, instance, mock, when } from 'ts-mockito';
import { Lifecycle, Request, ResponseToolkit, Server } from '@hapi/hapi';

describe('hapi i18n plugin', () => {
  it('should add a i18n instance to a request', async function () {
    // REGISTER PLUGIN
    // Arrange
    const options: HapiI18nPluginOptions = {
      locales: ['de-DE'],
      updateFiles: true,
    };
    const extFunction = await registerPluginAndGetExtensionMethod(options);

    // HANDLE REQUEST
    // Arrange
    const h = createResponseToolkitMock();
    const request = createRequestMock();

    // Act
    const returned = extFunction(request, h);

    // Assert
    expect(returned).to.equal(h.continue);
    const i18n = request.plugins.i18n;
    expect(i18n).to.be.a('object');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(i18n.__).to.be.a('function');
    expect(i18n.__('HELLO')).to.equal('HELLO');
    expect(i18n.getLocale()).to.equal('de-DE');
  });

  it('should use the token locale', async function () {
    // Arrange
    const options: HapiI18nPluginOptions = {
      locales: ['de-DE', 'en-US'],
      updateFiles: true,
    };
    const extFunction = await registerPluginAndGetExtensionMethod(options);

    const h = createResponseToolkitMock();
    const request = createRequestMock();
    request.auth.credentials = { locale: 'en-US' };

    // Act
    await extFunction(request, h);

    // Assert
    const i18n = request.plugins.i18n;
    expect(i18n.getLocale()).to.equal('en-US');
  });

  it('should use the first matching header locale', async function () {
    // Arrange
    const options: HapiI18nPluginOptions = {
      locales: ['de-DE', 'en-US'],
      updateFiles: true,
    };
    const extFunction = await registerPluginAndGetExtensionMethod(options);

    const h = createResponseToolkitMock();
    const request = createRequestMock();
    request.headers['accept-language'] = 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7';

    // Act
    await extFunction(request, h);

    // Assert
    const i18n = request.plugins.i18n;
    expect(i18n.getLocale()).to.equal('en-US');
  });

  it('should use the first matching language variant fallback as locale', async function () {
    // Arrange
    const options: HapiI18nPluginOptions = {
      locales: ['de-DE', 'en-US'],
      updateFiles: true,
    };
    const extFunction = await registerPluginAndGetExtensionMethod(options);

    const h = createResponseToolkitMock();
    const request = createRequestMock();
    request.headers['accept-language'] = 'fr-FR,fr;q=0.9,en-GB;q=0.8,en;q=0.7';

    // Act
    await extFunction(request, h);

    // Assert
    const i18n = request.plugins.i18n;
    expect(i18n.getLocale()).to.equal('en-US');
  });

  function createRequestMock(): Request {
    const mockedRequest = mock<Request>();
    mockedRequest.plugins; // tell the mock, that 'plugins' is a value
    mockedRequest.headers; // tell the mock, that 'headers' is a value
    mockedRequest.auth; // tell the mock, that 'auth' is a value
    return instance(mockedRequest);
  }

  function createResponseToolkitMock(): ResponseToolkit {
    const mockedResponseToolkit = mock<ResponseToolkit>();
    const sym = Symbol();
    when(mockedResponseToolkit.continue).thenReturn(sym);
    return instance(mockedResponseToolkit);
  }

  async function registerPluginAndGetExtensionMethod(
    options: i18n.ConfigurationOptions
  ): Promise<Lifecycle.Method> {
    const mockedServer = mock<Server>();
    const server = instance(mockedServer);

    // Act
    await hapiI18nPlugin.plugin.register(server, options);

    // Assert
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const [extPoint, extFunction] = capture(mockedServer.ext).last();
    expect(extPoint).to.equal('onPreHandler');
    expect(extFunction).to.be.a('function');
    return extFunction;
  }
});
