import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GenericFieldDescription } from '../../../../psa.app.core/models/compliance';
import {
  AbstractControl,
  FormControl,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { AlertService } from '../../../../_services/alert.service';
import { ComplianceService } from '../../../../psa.app.core/providers/compliance-service/compliance-service';

@Component({
  selector: 'app-compliance-radio',
  templateUrl: './compliance-radio.component.html',
  styleUrls: ['./compliance-radio.component.scss'],
})
export class ComplianceRadioComponent implements OnInit {
  systemCompliancePlaceholders = [
    { placeholder: 'app', name: 'COMPLIANCE.APP_USAGE' },
    { placeholder: 'bloodsamples', name: 'COMPLIANCE.BLOOD_SAMPLES' },
    { placeholder: 'labresults', name: 'COMPLIANCE.LAB_RESULTS' },
    { placeholder: 'samples', name: 'COMPLIANCE.NASAL_SWABS' },
  ];
  questionnaireCompliancePlaceholders: GenericFieldDescription[];
  newGenericRadioFieldForm: FormControl = new FormControl('', [
    Validators.minLength(1),
    this.mustNotContainValidator(/[^\w_-]/),
  ]);

  @Input() studyName: string;
  @Output() placeholderSelected = new EventEmitter<string>();

  constructor(
    private alertService: AlertService,
    private complianceService: ComplianceService
  ) {}

  ngOnInit(): void {
    this.complianceService
      .getGenericFields(this.studyName)
      .then((result) => {
        this.questionnaireCompliancePlaceholders = result.filter(
          (field) => field.type === 'RADIO'
        );
      })
      .catch((err) => {
        this.alertService.errorObject(err);
      });
  }

  onSelectSystemCompliance(compliancePlaceholder): void {
    const placeholder =
      '\n<pia-consent-input-radio-' +
      compliancePlaceholder +
      '></pia-consent-input-radio-' +
      compliancePlaceholder +
      '>';
    this.placeholderSelected.emit(placeholder);
  }

  onSelectQuestionnaireCompliance(
    compliancePlaceholder: GenericFieldDescription
  ): void {
    const placeholder =
      '\n<pia-consent-input-radio-generic name="' +
      compliancePlaceholder.placeholder +
      '"></pia-consent-input-radio-generic>';
    this.placeholderSelected.emit(placeholder);
  }

  addGenericRadioField(): void {
    if (this.newGenericRadioFieldForm.valid) {
      this.addGenericField({
        placeholder: this.newGenericRadioFieldForm.value,
        type: 'RADIO',
      });
      this.newGenericRadioFieldForm.reset();
    }
  }

  addGenericField(description: GenericFieldDescription): void {
    this.complianceService
      .addGenericField(this.studyName, description)
      .then((result) => {
        this.questionnaireCompliancePlaceholders = result.filter(
          (field) => field.type === 'RADIO'
        );
      })
      .catch((err) => this.alertService.errorObject(err));
  }

  mustNotContainValidator(forbiddenRe: RegExp): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const forbidden = forbiddenRe.test(control.value);
      return forbidden ? { mustNotContain: { value: control.value } } : null;
    };
  }
}
