import { BadgeService } from './badge.service';
import { MockBuilder, MockInstance, MockRender } from 'ng-mocks';
import { AppModule } from '../../../app.module';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';

describe('BadgeService', () => {
  let service: BadgeService;
  let spySetBadgeNumber;

  beforeEach(async () => {
    await MockBuilder(BadgeService, AppModule);
    spySetBadgeNumber = MockInstance(
      FirebaseX,
      'setBadgeNumber',
      jasmine.createSpy()
    );
    service = MockRender(BadgeService).point.componentInstance;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should set badge to the given number', () => {
    service.set(10);
    expect(spySetBadgeNumber).toHaveBeenCalledOnceWith(10);
  });
  it('should set badge to 0', () => {
    service.clear();
    expect(spySetBadgeNumber).toHaveBeenCalledOnceWith(0);
  });
});
