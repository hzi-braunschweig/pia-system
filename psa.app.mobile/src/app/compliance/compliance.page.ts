import { Component, DoCheck, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  LoadingController,
  MenuController,
  ViewWillEnter,
} from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { ComplianceService } from './compliance-service/compliance.service';
import { PrimaryStudyService } from '../shared/services/primary-study/primary-study.service';
import { ToastPresenterService } from '../shared/services/toast-presenter/toast-presenter.service';
import { ComplianceClientService } from './compliance-client/compliance-client.service';
import { ComplianceForStudyWrapper } from './compliance-for-study-wrapper';

@Component({
  selector: 'app-page-compliance',
  templateUrl: './compliance.page.html',
})
export class CompliancePage implements ViewWillEnter, DoCheck {
  complianceSent = false;

  studyName: string;

  studyWrapper: ComplianceForStudyWrapper;

  showAppUsageHint = false;

  @ViewChild(IonContent) content: IonContent;

  isUserIntent: boolean =
    !this.activatedRoute.snapshot.queryParamMap.get('returnTo');

  private returnTo: string =
    this.activatedRoute.snapshot.queryParamMap.get('returnTo');

  constructor(
    private primaryStudyService: PrimaryStudyService,
    private complianceClient: ComplianceClientService,
    private complianceService: ComplianceService,
    private loadingCtrl: LoadingController,
    private toastPresenter: ToastPresenterService,
    private translate: TranslateService,
    private menuCtrl: MenuController,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngDoCheck(): void {
    if (this.studyWrapper && !this.studyWrapper.editMode) {
      this.studyWrapper.form.disable();
    }
  }

  async ionViewWillEnter() {
    const loader = await this.loadingCtrl.create({
      message: this.translate.instant('GENERAL.LOADING'),
    });
    await loader.present();

    try {
      this.studyName = await this.primaryStudyService
        .getPrimaryStudy()
        .then((study) => study.name);

      const complianceData =
        await this.complianceService.getComplianceAgreementForCurrentUser(
          this.studyName
        );
      this.studyWrapper = new ComplianceForStudyWrapper(this.studyName);
      this.studyWrapper.setComplianceData(complianceData);

      this.complianceSent = complianceData !== null;
      if (!complianceData) {
        const text = await this.complianceClient.getComplianceText(
          this.studyName
        );
        // check if a text object was returned. If not, no compliance can or must be filled
        if (text) {
          this.studyWrapper.complianceTextObject = text.compliance_text_object;
          this.studyWrapper.complianceText = text.compliance_text;
        }
      }
    } catch (error) {
      console.error(error);
    }
    await loader.dismiss();
  }

  async submitCompliance() {
    this.studyWrapper.cleanFormControls();
    this.studyWrapper.form.markAllAsTouched();

    if (!this.studyWrapper.form.valid) {
      this.toastPresenter.presentToast(
        'COMPLIANCE.TOAST_MSG_FROM_NOT_COMPLETE'
      );
      return false;
    }

    const formComplianceData =
      this.studyWrapper.extractNewComplianceDataFromForm();
    try {
      const newComplianceData =
        await this.complianceService.updateComplianceAgreementForCurrentUser(
          formComplianceData,
          this.studyWrapper.studyName
        );
      this.studyWrapper.setComplianceData(newComplianceData);
      this.toastPresenter.presentToast(
        'COMPLIANCE.TOAST_MSG_SUCCESSFULLY_SENT'
      );
      this.complianceSent = true;
      this.menuCtrl.enable(newComplianceData.compliance_system.app);
      this.setShowAppUsageHint(false);
      if (newComplianceData.compliance_system.app && this.returnTo) {
        this.router.navigate([this.returnTo]);
      }
    } catch (err) {
      if (err.status === 422) {
        this.toastPresenter.presentToast(
          'COMPLIANCE.MSG_APP_COMPLIANCE_NEEDED'
        );
        this.setShowAppUsageHint(true);
        return false;
      } else {
        console.error(err);
      }
    }
  }

  setShowAppUsageHint(isShown: boolean) {
    this.showAppUsageHint = isShown;
    if (isShown) {
      // scroll to page top so that the message box is visible
      if (this.content) {
        this.content.scrollToTop();
      }
    }
  }

  downloadCompliance() {
    this.complianceClient.getComplianceAgreementPdfForCurrentUser(
      this.studyName
    );
  }

  complianceTextEmpty() {
    return (
      this.studyWrapper &&
      this.studyWrapper.complianceTextObject !== undefined &&
      this.studyWrapper.complianceTextObject === null
    );
  }
}
