export class Helper {
  public static sleep<T>(msec: number, value: T) {
    return new Promise<T>((done) => setTimeout(() => done(value), msec));
  }

  public static isResolved<T>(promise: Promise<T>) {
    return Promise.race([
      Helper.sleep(0, false),
      promise.then(
        () => true,
        () => false
      ),
    ]);
  }

  public static isRejected<T>(promise: Promise<T>) {
    return Promise.race([
      Helper.sleep(0, false),
      promise.then(
        () => false,
        () => true
      ),
    ]);
  }

  public static isFinished<T>(promise: Promise<T>) {
    return Promise.race([
      Helper.sleep(0, false),
      promise.then(
        () => true,
        () => true
      ),
    ]);
  }
}
