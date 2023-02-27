/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CallbackStorage } from './callback-storage';
import { OAuthState } from './keycloak.model';

describe('CallbackStorage', () => {
  let storage: CallbackStorage;

  const state = '1234';
  const key = 'kc-callback-' + state;

  beforeEach(() => {
    localStorage.clear();
    storage = new CallbackStorage();
  });

  it('should return undefined for empty state', () => {
    expect(storage.getOAuthState('')).toBeUndefined();
  });

  it('should return undefined for non-existing state', () => {
    expect(storage.getOAuthState('non-existing-state')).toBeUndefined();
  });

  it('should return OAuthState for existing state', () => {
    // Arrange
    const item: OAuthState = {
      redirectUri: 'https://example.com',
      nonce: '5678',
      prompt: 'none',
      pkceCodeVerifier: '1001',
      expires: new Date().getTime(),
    };
    localStorage.setItem(key, JSON.stringify(item));

    // Act
    const result = storage.getOAuthState(state);

    // Assert
    expect(result).toEqual(item);
  });

  it('should remove found OAuthState', () => {
    // Arrange
    const item: OAuthState = {
      redirectUri: 'https://example.com',
      nonce: '5678',
      prompt: 'none',
      pkceCodeVerifier: '1001',
      expires: new Date().getTime() + 100000,
    };
    localStorage.setItem(key, JSON.stringify(item));

    // Act
    storage.getOAuthState(state);

    // Assert
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('should remove expired OAuthStates', () => {
    // Arrange
    const expiredStateKey = 'kc-callback-5678';
    const item: OAuthState = {
      redirectUri: 'https://example.com',
      nonce: '5678',
      prompt: 'none',
      pkceCodeVerifier: '1001',
      expires: new Date().getTime() - 1000,
    };
    localStorage.setItem(expiredStateKey, JSON.stringify(item));

    // Act
    storage.getOAuthState(state);

    // Assert
    expect(localStorage.getItem(expiredStateKey)).toBeNull();
  });

  it('should remove OAuthState without expiration', () => {
    // Arrange
    const expiredStateKey = 'kc-callback-5678';
    const item: OAuthState = {
      redirectUri: 'https://example.com',
      nonce: '5678',
      prompt: 'none',
      pkceCodeVerifier: '1001',
    };
    localStorage.setItem(expiredStateKey, JSON.stringify(item));

    // Act
    storage.getOAuthState(state);

    // Assert
    expect(localStorage.getItem(expiredStateKey)).toBeNull();
  });

  it('should remove invalid JSON values', () => {
    // Arrange
    const invalidStateKey = 'kc-callback-9999';
    localStorage.setItem(invalidStateKey, 'this is no valid json');

    // Act
    storage.getOAuthState(state);

    // Assert
    expect(localStorage.getItem(invalidStateKey)).toBeNull();
  });
});
