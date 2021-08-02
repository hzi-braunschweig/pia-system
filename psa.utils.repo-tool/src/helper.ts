/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class Helper {
  public static async sleep<T>(msec: number, value: T): Promise<T> {
    return new Promise<T>((done) => setTimeout(() => done(value), msec));
  }

  public static async isResolved<T>(promise: Promise<T>): Promise<boolean> {
    return Promise.race([
      Helper.sleep(0, false),
      promise.then(
        () => true,
        () => false
      ),
    ]);
  }

  public static async isRejected<T>(promise: Promise<T>): Promise<boolean> {
    return Promise.race([
      Helper.sleep(0, false),
      promise.then(
        () => false,
        () => true
      ),
    ]);
  }

  public static async isFinished<T>(promise: Promise<T>): Promise<boolean> {
    return Promise.race([
      Helper.sleep(0, false),
      promise.then(
        () => true,
        () => true
      ),
    ]);
  }
}
