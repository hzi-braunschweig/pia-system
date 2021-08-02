/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  LatestFollowUpEndDateForPerson,
  SormasserviceClient,
} from '../clients/sormasserviceClient';
import { startOfToday, addDays, subDays } from 'date-fns';

/**
 * @description fetches sormas end dates and returns end dates for specific users
 */
export class SormasEndDateService {
  private static readonly CACHE_EXPIRATION_IN_DAYS = 1;
  /**
   * Controls, how long the fetched end dates dates should go back in history
   */
  private static readonly FETCH_FOR_LATEST_DAYS = 14;

  /**
   * Caches the end dates from sormasservice
   */
  private static endDateCache: Map<string, Date> = new Map();

  /**
   * Starts with current Date in order to fill the cache initially.
   *
   * Cache expiration is later set to next day 0:00h in order to only fetch
   * once while checkAndUpdateQuestionnaireInstancesStatus is running.
   */
  private static cacheExpiration: Date = startOfToday();

  /**
   * Defines time from which results should be fetched
   *
   * Here we need to consider the length of possible down times
   * during which data won't be fetched and processed.
   * This time is currently set to 14 days in the past.
   */
  private static fetchSinceParam: Date =
    SormasEndDateService.getFetchSinceParam();

  /**
   * Returns end date of user with uuid or undefined if not found
   */
  public static async getEndDateForUUID(
    uuid: string
  ): Promise<Date | undefined> {
    if (this.isCacheRefreshNeeded()) {
      await this.fetchEndDates();
    }
    return this.endDateCache.get(uuid);
  }

  /**
   * Fetches end dates from sormasservice and refreshes the cache
   */
  private static async fetchEndDates(): Promise<void> {
    const sormasEndDates =
      await SormasserviceClient.getEndDatesForSormasProbands(
        this.fetchSinceParam
      );
    if (Array.isArray(sormasEndDates)) {
      this.endDateCache = this.convertToMap(sormasEndDates);
      this.cacheExpiration = this.getCacheExpirationDate();
      this.fetchSinceParam = this.getFetchSinceParam();
    }
  }

  /**
   * Will check if cache is expired
   */
  private static isCacheRefreshNeeded(): boolean {
    return Date.now() > this.cacheExpiration.getTime();
  }

  /**
   * Converts a list of results into a Map which keys are UUIDs and which values
   * are the corresponding followUpEndDates. Removes values which are not of
   * type number.
   */
  private static convertToMap(
    followUpEndList: LatestFollowUpEndDateForPerson[]
  ): Map<string, Date> {
    // When the latestFollowUpEndDate equals NULL, then no more follow-ups are to be expected.
    // Moreover, the Proband will be deleted from PIA and all actual answers are ought to be sent to Sormas
    const keyValuePairList = followUpEndList.map((entry): [string, Date] => [
      entry.personUuid,
      new Date(entry.latestFollowUpEndDate),
    ]);
    return new Map(keyValuePairList);
  }

  private static getCacheExpirationDate(): Date {
    return addDays(startOfToday(), this.CACHE_EXPIRATION_IN_DAYS);
  }

  private static getFetchSinceParam(): Date {
    return subDays(startOfToday(), this.FETCH_FOR_LATEST_DAYS);
  }
}
