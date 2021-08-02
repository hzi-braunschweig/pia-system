/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { BlockedIPService } from './blockedIPService';

describe('BlockedIPService', () => {
  const MAX_LRU_CACHE_SIZE = 3;
  let blockedIPService: BlockedIPService;

  before(() => {
    blockedIPService = new BlockedIPService(MAX_LRU_CACHE_SIZE);
  });

  it('should save and return BlockedIpData', () => {
    blockedIPService.put('140.180.90.180', {
      third_wrong_password_at: 1620726309999,
      number_of_wrong_attempts: 0,
    });
    expect(blockedIPService.get('140.180.90.180')).to.eql({
      third_wrong_password_at: 1620726309999,
      number_of_wrong_attempts: 0,
    });
  });

  it('should overwrite existing entries', () => {
    blockedIPService.put('140.180.90.180', {
      third_wrong_password_at: 0,
      number_of_wrong_attempts: 0,
    });
    expect(blockedIPService.get('140.180.90.180')).to.eql({
      third_wrong_password_at: 0,
      number_of_wrong_attempts: 0,
    });
    blockedIPService.put('140.180.90.180', {
      third_wrong_password_at: 1620726309999,
      number_of_wrong_attempts: 0,
    });
    expect(blockedIPService.get('140.180.90.180')).to.eql({
      third_wrong_password_at: 1620726309999,
      number_of_wrong_attempts: 0,
    });
  });

  it('should only keep the least recent 3 IPs in cache', () => {
    blockedIPService.put('98.198.226.51', {
      third_wrong_password_at: 1620726303283,
      number_of_wrong_attempts: 1,
    });
    blockedIPService.put('145.184.90.182', {
      third_wrong_password_at: 1620726303283,
      number_of_wrong_attempts: 1,
    });
    blockedIPService.put('255.20.78.253', {
      third_wrong_password_at: 1620726303283,
      number_of_wrong_attempts: 1,
    });
    blockedIPService.put('159.193.158.34', {
      third_wrong_password_at: 1620726303283,
      number_of_wrong_attempts: 1,
    });

    expect(blockedIPService.get('98.198.226.51')).to.eql({
      third_wrong_password_at: 0,
      number_of_wrong_attempts: 0,
    });
    expect(blockedIPService.get('145.184.90.182')).to.eql({
      third_wrong_password_at: 1620726303283,
      number_of_wrong_attempts: 1,
    });
  });
});
