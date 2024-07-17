/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

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

export async function asyncForEach<T>(
  array: T[],
  callback: (entry: T, index: number, array: T[]) => Promise<void>
): Promise<void> {
  await asyncMap(array, callback);
}

export async function asyncMapParallel<I, O>(
  array: I[],
  callback: (entry: I, index: number, array: I[]) => Promise<O>,
  maxParallel: number
): Promise<O[]> {
  const input = array.map((entry, index) => {
    return {
      entry,
      index,
    };
  });
  const outputArray: O[] = new Array<O>(array.length);

  await Promise.all(
    Array.from(Array(maxParallel).keys()).map(async () => {
      for (;;) {
        const work = input.shift();
        if (!work) {
          return;
        }

        outputArray[work.index] = await callback(work.entry, work.index, array);
      }
    })
  );

  return outputArray;
}

export async function asyncForEachParallel<T>(
  array: T[],
  callback: (entry: T, index: number, array: T[]) => Promise<void>,
  maxParallel: number
): Promise<void> {
  await asyncMapParallel(array, callback, maxParallel);
}
