/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
  /**
   * Allow to reveal the password by button click
   */
  window.addEventListener('load', function () {
    // login/registration password input
    initPasswordReveal(
      document.getElementById('reveal-password-button'),
      document.getElementById('password')
    );
    // update password input
    initPasswordReveal(
      document.getElementById('reveal-password-new-button'),
      document.getElementById('password-new')
    );
    // update password/registration confirm input
    initPasswordReveal(
      document.getElementById('reveal-password-confirm-button'),
      document.getElementById('password-confirm')
    );
  });

  function initPasswordReveal(button, input) {
    if (button && input) {
      button.addEventListener('pointerdown', () => (input.type = 'text'));
      button.addEventListener('pointerup', () => (input.type = 'password'));
    }
  }
})();
