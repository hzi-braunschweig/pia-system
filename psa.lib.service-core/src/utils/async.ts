/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export async function asyncForEach<T>(
  array: T[],
  callback: (entry: T, index: number, array: T[]) => Promise<void>
): Promise<void> {
  for (let index = 0; index < array.length; index++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion,security/detect-object-injection
    await callback(array[index]!, index, array);
  }
}

export async function asyncMap<I, O>(
  array: I[],
  callback: (entry: I, index: number, array: I[]) => Promise<O>
): Promise<O[]> {
  const outputArray: O[] = [];
  for (let index = 0; index < array.length; index++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion,security/detect-object-injection
    outputArray[index] = await callback(array[index]!, index, array);
  }
  return outputArray;
}
