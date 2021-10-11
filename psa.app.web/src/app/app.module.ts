/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CdkTableModule } from '@angular/cdk/table';
import { DatePipe, registerLocaleData } from '@angular/common';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpClientModule,
} from '@angular/common/http';
import localeDe from '@angular/common/locales/de';
import localeEn from '@angular/common/locales/en';
import localeDeExtra from '@angular/common/locales/extra/de';
import localeEnExtra from '@angular/common/locales/extra/en';
import { LOCALE_ID, NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MarkdownModule } from 'ngx-markdown';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { MatomoModule } from 'ngx-matomo-v9';
import { NgxUsefulSwiperModule } from 'ngx-useful-swiper';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/startWith';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { DialogSelectForPartialDeletionComponent } from './dialogs/dialog-partial-deletion/select/dialog-select-for-partial-deletion.component';
import { DialogViewPartialDeletionComponent } from './dialogs/dialog-partial-deletion/view/dialog-view-partial-deletion.component';
import { DialogConfirmPartialDeletionComponent } from './dialogs/dialog-partial-deletion/confirm/dialog-confirm-partial-deletion.component';
import { DialogCreatePartialDeletionComponent } from './dialogs/dialog-partial-deletion/create/dialog-create-partial-deletion.component';
import { DialogExportDataComponent } from './dialogs/export-dialog/export-dialog.component';
import { DialogNewIdsComponent } from './dialogs/new-ids-dialog/new-ids-dialog';
import { DialogNewPlannedProbandsComponent } from './dialogs/new-planned-probands-dialog/new-planned-probands-dialog.component';
import { DialogNewProbandComponent } from './dialogs/new-proband-dialog/new-proband-dialog';
import { DialogNewUserComponent } from './dialogs/new-user-dialog/new-user-dialog.component';
import { DialogStudyComponent } from './dialogs/study-dialog/study-dialog';
import { DialogUserEditComponent } from './dialogs/user-edit-dialog/user-edit-dialog';
import { DialogUserStudyAccessComponent } from './dialogs/user-study-dialog/user-study-dialog';
import { ChangePasswordComponent } from './features/changePassword/changePassword.component';
import { CollectiveLoginLettersComponent } from './features/collective-login-letters/collective-login-letters.component';
import { CollectiveSampleLettersComponent } from './features/collective-sample-letters/collective-sample-letters.component';
import { SideNavigationComponent } from './features/side-navigation/side-navigation.component';
import { MaterialModule } from './material.module';
import { ComplianceProbandsComponent } from './pages/compliance/compliance-probands/compliance-probands.component';
import { ComplianceResearcherComponent } from './pages/compliance/compliance-researcher/compliance-researcher.component';
import { ContactComponent } from './pages/contact/contact.component';
import { HomeComponent } from './pages/home/home.component';
import { InternalUsersComponent } from './pages/internal-users/internal-users.component';
import { LaboratoryResultDetailsComponent } from './pages/laboratories/laboratory-result-details/laboratory-result-details.component';
import { LaboratoryResultsListComponent } from './pages/laboratories/laboratory-results-list/laboratory-results-list.component';
import { LaboratoryResultsComponent } from './pages/laboratories/laboratory-results/laboratory-results.component';
import {
  ConfirmNewMaterialRequestComponent,
  RequestNewMaterialComponent,
} from './pages/laboratories/request-new-material/request-new-material.component';
import { LoginComponent } from './pages/login/login.component';
import { LogsResearcherComponent } from './pages/logs-researcher/logs-researcher.component';
import { LogsDeleteSysAdminComponent } from './pages/logsDelete-sysAdmin/logsDelete-sysAdmin.component';
import { PlannedProbandsComponent } from './pages/planned-probands/planned-probands.component';
import { ContactProbandComponent } from './pages/probands/contact-proband/contact-proband.component';
import { ProbandPersonalInfoComponent } from './pages/probands/proband-personal-info/proband-personal-info.component';
import { ProbandComponent } from './pages/probands/proband/proband.component';
import { ProbandsPersonalInfoComponent } from './pages/probands/probands-personal-info/probands-personal-info.component';
import { ProbandsComponent } from './pages/probands/probands/probands.component';
import { FileAnswerOptionComponent } from './pages/questionnaires/question-proband/answer-options/file-answer-option/file-answer-option.component';
import { ImageAnswerOptionComponent } from './pages/questionnaires/question-proband/answer-options/image-answer-option/image-answer-option.component';
import { TimestampAnswerOptionComponent } from './pages/questionnaires/question-proband/answer-options/timestamp-answer-option/timestamp-answer-option.component';
import { QuestionProbandComponent } from './pages/questionnaires/question-proband/question-proband.component';
import {
  QuestionnaireInstancesComponent,
  ShowColumnDirective as ShowColumnDirectiveQuestionnaireInstances,
} from './pages/questionnaires/questionnaire-instances/questionnaire-instances.component';
import { QuestionnaireResearcherComponent } from './pages/questionnaires/questionnaire-researcher/questionnaire-researcher.component';
import { QuestionnairesResearcherComponent } from './pages/questionnaires/questionnaires-researcher/questionnaires-researcher.component';
import { SampleManagementComponent } from './pages/samples/sample-management/sample-management.component';
import {
  ImplementStatusPipe,
  ImplementStatusPipe2,
  RemarkDialogComponent,
  SamplesComponent,
  ScanDialogComponent,
} from './pages/samples/samples/samples.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { StudiesComponent } from './pages/studies/studies/studies.component';
import {
  ShowColumnDirective as ShowColumnDirectiveStudyAccesses,
  StudyAccessesComponent,
} from './pages/studies/study-accesses/study-accesses.component';
import { GetActivityTypePipe } from './pipes/acitivity-type.pipe';
import { StripMarkdown } from './pipes/strip-markdown.pipe';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { SampleTrackingService } from 'src/app/psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { LoggingService } from 'src/app/psa.app.core/providers/logging-service/logging-service';
import { NotificationService } from 'src/app/psa.app.core/providers/notification-service/notification-service';
import { PersonalDataService } from 'src/app/psa.app.core/providers/personaldata-service/personaldata-service';
import { QuestionnaireService } from './psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertComponent } from './_directives/alert.component';
import { AppDateAdapter } from './_helpers/date-adapter';
import { DialogChangeComplianceComponent } from './_helpers/dialog-change-compliance';
import { DialogDeleteComponent } from './_helpers/dialog-delete';
import { DialogDeletePartnerComponent } from './_helpers/dialog-delete-partner';
import { DialogInfoComponent } from './_helpers/dialog-info';
import { DialogOkCancelComponent } from './_helpers/dialog-ok-cancel';
import { DialogPopUpComponent } from './_helpers/dialog-pop-up';
import { DialogQuestionnaireFailComponent } from './_helpers/dialog-questionnaire-fail';
import { DialogQuestionnaireSuccessComponent } from './_helpers/dialog-questionnaire-success';
import { ScanSampleComponent } from './_helpers/dialog-scan-sample';
import { DialogUserDataComponent } from './_helpers/dialog-user-data';
import { DialogYesNoComponent } from './_helpers/dialog-yes-no';
import {
  DialogNotificationComponent,
  NotificationComponent,
} from './_helpers/notification';
import { AlertService } from './_services/alert.service';
import { AuthenticationManager } from './_services/authentication-manager.service';
import { DataService } from './_services/data.service';
import { FCMService } from './_services/fcm.service';
import { ProbandsToContactComponent } from './pages/probands-to-contact/probands-to-contact.component';
import { ProbandService } from './psa.app.core/providers/proband-service/proband.service';
import { DialogChangeStudyComponent } from './dialogs/dialog-change-study/dialog-change-study.component';
import { SafeUrlPipe } from './pipes/safe-url.pipe';
import { ComplianceManagerComponent } from './pages/compliance/compliance-manager/compliance-manager.component';
import { StudyAccessPipe } from './pipes/study-access.pipe';
import { AccountStatusPipe } from './pipes/account-status.pipe';
import { ProbandsListModule } from './features/probands-list/probands-list.module';
import { LoadingSpinnerModule } from './features/loading-spinner/loading-spinner.module';
import { DialogViewComplianceComponent } from './pages/compliance/compliance-view-dialog/dialog-view-compliance.component';
import { DialogEditComplianceComponent } from './pages/compliance/compliance-edit-dialog/dialog-edit-compliance.component';
import { ComplianceViewListEntryComponent } from './pages/compliance/compliance-view-list/compliance-view-list-entry.component';
import { ComplianceViewListComponent } from './pages/compliance/compliance-view-list/compliance-view-list.component';
import { ComplianceExaminerComponent } from './pages/compliance/compliance-examiner/compliance-examiner.component';
import { ComplianceEditExaminerComponent } from './pages/compliance/compliance-edit/compliance-edit-examiner/compliance-edit-examiner.component';
import { ComplianceEditProbandComponent } from './pages/compliance/compliance-edit/compliance-edit-proband/compliance-edit-proband.component';
import { SormasIframeComponent } from './features/sormas-iframe/sormas-iframe.component';
import { DialogNewSormasProbandComponent } from './dialogs/new-sormas-proband-dialog/new-sormas-proband-dialog.component';
import { ProbandsUntersuchungsteamComponent } from './pages/probands/probands-untersuchungsteam/probands-untersuchungsteam.component';
import { ProbandsForscherComponent } from './pages/probands/probands-forscher/probands-forscher.component';
import { MatOptionSelectAllModule } from './features/mat-option-select-all/mat-option-select-all.module';
import { LocaleService } from './_services/locale.service';
import { AuthInterceptor } from './_interceptors/auth-interceptor';
import { ContentTypeInterceptor } from './_interceptors/content-type-interceptor';
import { UnauthorizedInterceptor } from './_interceptors/unauthorized-interceptor';
import { SelectedProbandInfoService } from './_services/selected-proband-info.service';
import { StudyWelcomeTextComponent } from './pages/study-welcome-text/study-welcome-text.component';
import { TemplateModule } from './features/template-viewer/template.module';
import { DateAdapter } from '@angular/material/core';
import { CustomDateAdapter } from './_helpers/custom-date-adapter';
import { ComplianceTextComponent } from './pages/compliance/compliance-researcher/compliance-text/compliance-text.component';
import { ComplianceRadioComponent } from './pages/compliance/compliance-researcher/compliance-radio/compliance-radio.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { QuestionnaireInstancesListComponent } from './pages/questionnaire-instances/questionnaire-instances-list/questionnaire-instances-list.component';
import { QuestionnaireInstancesListForInvestigatorComponent } from './pages/questionnaire-instances/questionnaire-instances-list-for-investigator/questionnaire-instances-list-for-investigator.component';
import { QuestionnaireInstancesListForProbandComponent } from './pages/questionnaire-instances/questionnaire-instances-list-for-proband/questionnaire-instances-list-for-proband.component';
import { LicenseListComponent } from './pages/license-list/license-list.component';

// === LOCALE ===
// Setup ngx-translate
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/');
}

// Setup locales for angular i18n (for date pipes etc.)
registerLocaleData(localeEn, 'en', localeEnExtra);
registerLocaleData(localeDe, 'de', localeDeExtra);

// === Module ===
@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    MaterialModule,
    CdkTableModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgxUsefulSwiperModule,
    FlexLayoutModule,
    NgxMaterialTimepickerModule,
    MarkdownModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    MatomoModule,
    ProbandsListModule,
    LoadingSpinnerModule,
    MatOptionSelectAllModule,
    TemplateModule,
    DragDropModule,
  ],
  declarations: [
    GetActivityTypePipe,
    StudyAccessPipe,
    AccountStatusPipe,
    StripMarkdown,
    AppComponent,
    AlertComponent,
    HomeComponent,
    LoginComponent,
    SideNavigationComponent,
    DialogPopUpComponent,
    DialogDeleteComponent,
    DialogDeletePartnerComponent,
    DialogChangeComplianceComponent,
    DialogChangeStudyComponent,
    DialogNewProbandComponent,
    DialogNewIdsComponent,
    DialogStudyComponent,
    DialogUserStudyAccessComponent,
    DialogUserEditComponent,
    DialogUserDataComponent,
    DialogExportDataComponent,
    DialogSelectForPartialDeletionComponent,
    DialogViewPartialDeletionComponent,
    DialogCreatePartialDeletionComponent,
    DialogConfirmPartialDeletionComponent,
    DialogNewUserComponent,
    DialogNewPlannedProbandsComponent,
    DialogNewSormasProbandComponent,
    DialogQuestionnaireSuccessComponent,
    DialogQuestionnaireFailComponent,
    DialogYesNoComponent,
    DialogOkCancelComponent,
    DialogInfoComponent,
    ChangePasswordComponent,
    QuestionnairesResearcherComponent,
    QuestionnaireResearcherComponent,
    QuestionProbandComponent,
    ShowColumnDirectiveQuestionnaireInstances,
    ShowColumnDirectiveStudyAccesses,
    ProbandsComponent,
    ProbandsUntersuchungsteamComponent,
    ProbandsForscherComponent,
    ProbandComponent,
    ProbandsPersonalInfoComponent,
    ProbandPersonalInfoComponent,
    ContactProbandComponent,
    StudiesComponent,
    ImageAnswerOptionComponent,
    FileAnswerOptionComponent,
    TimestampAnswerOptionComponent,
    QuestionnaireInstancesComponent,
    StudyAccessesComponent,
    InternalUsersComponent,
    SettingsComponent,
    SampleManagementComponent,
    PlannedProbandsComponent,
    CollectiveSampleLettersComponent,
    CollectiveLoginLettersComponent,
    SamplesComponent,
    RemarkDialogComponent,
    ScanDialogComponent,
    LaboratoryResultsComponent,
    LaboratoryResultsListComponent,
    LaboratoryResultDetailsComponent,
    ImplementStatusPipe,
    ImplementStatusPipe2,
    RequestNewMaterialComponent,
    ConfirmNewMaterialRequestComponent,
    LogsResearcherComponent,
    ProbandsToContactComponent,
    LogsDeleteSysAdminComponent,
    ScanSampleComponent,
    NotificationComponent,
    DialogNotificationComponent,
    ContactComponent,
    ComplianceProbandsComponent,
    ComplianceResearcherComponent,
    ComplianceExaminerComponent,
    SafeUrlPipe,
    ComplianceManagerComponent,
    ComplianceViewListComponent,
    ComplianceViewListEntryComponent,
    DialogViewComplianceComponent,
    ComplianceEditExaminerComponent,
    ComplianceEditProbandComponent,
    DialogEditComplianceComponent,
    SormasIframeComponent,
    StudyWelcomeTextComponent,
    ComplianceTextComponent,
    ComplianceRadioComponent,
    QuestionnaireInstancesListComponent,
    QuestionnaireInstancesListForInvestigatorComponent,
    QuestionnaireInstancesListForProbandComponent,
    LicenseListComponent,
  ],
  entryComponents: [
    DialogDeleteComponent,
    DialogDeletePartnerComponent,
    DialogChangeComplianceComponent,
    DialogChangeStudyComponent,
    DialogNewProbandComponent,
    DialogNewIdsComponent,
    DialogStudyComponent,
    DialogPopUpComponent,
    DialogUserStudyAccessComponent,
    DialogUserEditComponent,
    DialogUserDataComponent,
    DialogExportDataComponent,
    DialogSelectForPartialDeletionComponent,
    DialogNewUserComponent,
    DialogNewPlannedProbandsComponent,
    DialogNewSormasProbandComponent,
    DialogQuestionnaireSuccessComponent,
    DialogQuestionnaireFailComponent,
    RemarkDialogComponent,
    ScanDialogComponent,
    DialogYesNoComponent,
    DialogInfoComponent,
    ConfirmNewMaterialRequestComponent,
    DialogOkCancelComponent,
    DialogNotificationComponent,
    DialogViewComplianceComponent,
    DialogEditComplianceComponent,
  ],
  providers: [
    {
      provide: LOCALE_ID,
      useFactory: (localeService: LocaleService) => {
        return localeService.currentLocale;
      },
      deps: [LocaleService],
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ContentTypeInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UnauthorizedInterceptor,
      multi: true,
    },
    { provide: DateAdapter, useClass: CustomDateAdapter },
    AppDateAdapter,
    AlertService,
    AuthService,
    ProbandService,
    DataService,
    FCMService,
    AuthenticationManager,
    NotificationService,
    QuestionnaireService,
    Title,
    SampleTrackingService,
    PersonalDataService,
    SelectedProbandInfoService,
    LoggingService,
    NotificationComponent,
    StudyAccessPipe,
    AccountStatusPipe,
    DatePipe,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
