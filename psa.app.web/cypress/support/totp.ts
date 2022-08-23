/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import totp from 'totp-generator';

import { UserCredentials } from './user.commands';
import { login } from './commands';
import Chainable = Cypress.Chainable;

const appUrl = '/admin/';

export function setupTotpForSysAdmin(): Chainable {
  return cy.url().then((originalUrl) => {
    cy.visit(appUrl);

    return cy
      .fixture('users')
      .then((res) => cy.wrap<UserCredentials>(res.existing.SysAdmin))
      .then((credentials) => login(credentials.username, credentials.password))
      .then(() => cy.get('#kc-content'))
      .then((content) => {
        // as soon as the content is rendered, check if we are in totp setup
        if (content.find('#kc-totp-secret-qr-code').length > 0) {
          cy.get('#kc-totp-secret-qr-code')
            .invoke('attr', 'src')
            .then((imageSrc) => {
              const totpQrCode = readQrCodeFromImage(imageSrc);
              cy.log('totpQrCode:', totpQrCode);

              const totpSecret = readTotpSecretFromQrCodeData(totpQrCode);
              cy.log('totpSecret:', totpSecret);

              const token = totp(totpSecret);
              cy.log('token:', token);

              cy.get('#kc-totp-settings-form #totp').type(token);
              cy.get('#saveTOTPBtn').click();

              cy.expectPathname('/admin/home');
              cy.get('[data-e2e="e2e-logout"]').click();

              cy.writeFile('.e2e-totp-secret', totpSecret);
              cy.wrap(totpSecret).as('totpSecret');
            });
        } else {
          cy.log('totp already configured. Skipping setup...');
          cy.readFile('.e2e-totp-secret').then((totpSecret) =>
            cy.wrap(totpSecret).as('totpSecret')
          );
        }
        cy.visit(originalUrl);
      });
  });
}

function readQrCodeFromImage(imageData: string): string | null {
  const base64imageData = imageData.slice('data:image/png;base64,'.length);
  const png = PNG.sync.read(Buffer.from(base64imageData, 'base64'));
  const code = jsQR(Uint8ClampedArray.from(png.data), png.width, png.height);

  if (!code) {
    return null;
  }
  return code.data;
}

/**
 * Example: otpauth://totp/PIA%20Admin%20App:e2e-admin%40example.com?secret=J5AVIVSRMNWUOT3MM5HU46TDJ5TUQOKU&digits=6&algorithm=SHA1&issuer=PIA%20Admin%20App&period=30
 */
function readTotpSecretFromQrCodeData(qrCodeData: string): string {
  const start = qrCodeData.indexOf('secret=') + 7;
  const end = qrCodeData.indexOf('&digits');
  return qrCodeData.slice(start, end);
}
