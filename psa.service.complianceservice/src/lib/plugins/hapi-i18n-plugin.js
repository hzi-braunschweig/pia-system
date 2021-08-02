/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { I18n } = require('i18n');

/**
 * Plugin that registers i18n to the request and parses the locale from the jwt-Token
 * @type {{name: string, register: register}}
 */
exports.plugin = {
  name: 'i18n',
  register: function (server, options) {
    const pluginOptions = options ? options : {};
    if (!pluginOptions.locales || pluginOptions.locales.length === 0) {
      throw Error('No locales defined!');
    }
    const defaultLocale =
      pluginOptions.defaultLocale || pluginOptions.locales[0];

    server.ext('onPreHandler', function (request, h) {
      request.i18n = new I18n(options);
      const locale =
        (request.auth &&
          request.auth.credentials &&
          request.auth.credentials.locale) ||
        defaultLocale;
      request.i18n.setLocale(locale);
      return h.continue;
    });
  },
};
