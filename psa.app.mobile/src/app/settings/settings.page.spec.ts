/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { MockComponent, MockPipe, MockService } from 'ng-mocks';

import { SettingsPage } from './settings.page';
import { HeaderComponent } from '../shared/components/header/header.component';
import { DeleteAccountModalService } from '../account/services/delete-account-modal.service';
import { AccountModule } from '../account/account.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SettingsPage', () => {
  let component: SettingsPage;
  let fixture: ComponentFixture<SettingsPage>;
  let deleteAccountModalService: Partial<DeleteAccountModalService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        SettingsPage,
        MockPipe(TranslatePipe),
        MockComponent(HeaderComponent),
      ],
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule,
        AccountModule,
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: DeleteAccountModalService,
          use: deleteAccountModalService,
        },
      ],
    }).compileComponents();

    deleteAccountModalService = TestBed.inject(DeleteAccountModalService);

    fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open account deletion modal', () => {
    const showDeleteAccountModalSpy = spyOn(
      deleteAccountModalService,
      'showDeleteAccountModal'
    );

    component.openDeleteAccountModal();

    expect(showDeleteAccountModalSpy).toHaveBeenCalled();
  });
});
