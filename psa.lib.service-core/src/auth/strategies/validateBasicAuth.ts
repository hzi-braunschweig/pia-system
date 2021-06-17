import { Request } from '@hapi/hapi';
import * as Boom from '@hapi/boom';

import { BasicValidationFn, ValidationResult } from '../authModel';
import { BlockedIPService } from '../blockedIPService';

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_TO_WAIT = 300; // 5 minutes
const MAX_WRONG_ATTEMPTS = 3;
const MAX_LRU_CACHE_SIZE = 1000;

export function validateBasicAuth(
  basicUsername: string,
  basicPassword: string
): BasicValidationFn {
  const blockedIPService = new BlockedIPService(MAX_LRU_CACHE_SIZE);

  return function (
    request: Request,
    username: string,
    password: string
  ): ValidationResult {
    const xFF: string | undefined = request.headers['x-forwarded-for'];
    // if xFF is a string, split will always return an array with at least one element.
    // The first one is the ip of the client.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ip: string = xFF ? xFF.split(',')[0]! : request.info.remoteAddress;

    const blockedIP = blockedIPService.get(ip);
    if (
      blockedIP.number_of_wrong_attempts >= MAX_WRONG_ATTEMPTS &&
      blockedIP.third_wrong_password_at
    ) {
      const timeSinceLastWrongAttemptSec = Math.floor(
        (Date.now() - blockedIP.third_wrong_password_at) /
          MILLISECONDS_PER_SECOND
      );
      const remainingTime = SECONDS_TO_WAIT - timeSinceLastWrongAttemptSec;
      if (remainingTime > 0) {
        throw Boom.forbidden(
          `User has 3 failed login attempts and is banned for ${remainingTime} seconds`
        );
      }
    }

    if (username === basicUsername && password === basicPassword) {
      return { isValid: true, credentials: { name: username } };
    } else {
      blockedIP.number_of_wrong_attempts += 1;
      blockedIP.third_wrong_password_at = Date.now();
      blockedIPService.put(ip, blockedIP);
      return { isValid: false };
    }
  };
}
