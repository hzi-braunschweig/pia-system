import { Component, OnInit } from '@angular/core';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { AlertService } from '../../_services/alert.service';
import 'datejs';
import {
  APP_DATE_FORMATS,
  AppDateAdapter,
} from 'src/app/_helpers/date-adapter';
import { TranslateService } from '@ngx-translate/core';
import { AuthenticationManager } from '../../_services/authentication-manager.service';
import { ComplianceManager } from '../../_services/compliance-manager.service';
import { ComplianceType } from '../../psa.app.core/models/compliance';

@Component({
  templateUrl: 'contact.component.html',
  styleUrls: ['./contact.component.scss'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'de' },
    {
      provide: DateAdapter,
      useClass: AppDateAdapter,
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: APP_DATE_FORMATS,
    },
  ],
})
export class ContactComponent implements OnInit {
  currentRole: string;
  addresses: any[];
  noAddresses: string = null;
  hasSampleCompliance: boolean;

  constructor(
    public translate: TranslateService,
    private alertService: AlertService,
    private questionnaireService: QuestionnaireService,
    private auth: AuthenticationManager,
    private complianceManager: ComplianceManager
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.currentRole = this.auth.currentRole;
      this.hasSampleCompliance =
        await this.complianceManager.userHasCompliances([
          ComplianceType.SAMPLES,
        ]);
      this.addresses = await this.questionnaireService.getStudyAddresses();
      if (this.addresses.length === 0) {
        this.noAddresses = this.translate.instant('SIDENAV.NO_CONTACT_INFO');
      }
    } catch (err) {
      this.alertService.errorObject(err);
    }
  }
}
