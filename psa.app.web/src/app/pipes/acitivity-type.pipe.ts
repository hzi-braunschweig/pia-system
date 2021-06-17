import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'getActivityType' })
export class GetActivityTypePipe implements PipeTransform {
  transform(activityType: any): string | undefined {
    if (activityType === 'login') {
      return 'LOGS.LOGIN';
    }
    if (activityType === 'logout') {
      return 'LOGS.LOGOUT';
    }
    if (activityType === 'q_released_once') {
      return 'LOGS.Q_RELEASED_ONCE';
    }
    if (activityType === 'q_released_twice') {
      return 'LOGS.Q_RELEASED_TWICE';
    }

    return undefined;
  }
}
