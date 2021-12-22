/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Previously cycle_first_hour was saved in UTC time. As it was not saved with any time zone information,
 * it was not possible to respect summer time / winter time. Thus, we now save the time zoned value.
 * The time zone information is based on a global time zone configuration for the specific instance.
 *
 * Here we migrate all existing cycle_first_hour values to reflect that change. This calculation assumes that:
 *   1. the executing instance runs in UTC time
 *   2. the value was initially saved for the Europe/Berlin time zone.
 *
 * We add _one_ hour to cycle_first_hour because this change is made in the beginning of winter time. This results
 * in values which fit to the actual issues dates of questionnaires at least for the upcoming winter time. All newly
 * created questionnaires will have correct values which are correct in summer and winter.
 */
UPDATE questionnaires SET cycle_first_hour = cycle_first_hour+1;
