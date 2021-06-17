import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GenericFieldDescription } from '../../../../psa.app.core/models/compliance';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { AlertService } from '../../../../_services/alert.service';
import { ComplianceService } from '../../../../psa.app.core/providers/compliance-service/compliance-service';

@Component({
  selector: 'app-compliance-text',
  templateUrl: './compliance-text.component.html',
  styleUrls: ['./compliance-text.component.scss'],
})
export class ComplianceTextComponent implements OnInit {
  textfieldPlaceholders = [
    { placeholder: 'firstname', name: 'GENERAL.FIRST_NAME' },
    { placeholder: 'lastname', name: 'GENERAL.NAME' },
    { placeholder: 'birthdate', name: 'GENERAL.BIRTHDAY' },
    { placeholder: 'location', name: 'GENERAL.PLACE' },
    { placeholder: 'date', name: 'GENERAL.DATE' },
  ];
  questionnaireComplianceTextfieldPlaceholders: GenericFieldDescription[];
  newGenericTextfieldForm: FormGroup = new FormGroup({
    label: new FormControl(''),
    placeholder: new FormControl('', [
      Validators.minLength(1),
      this.mustNotContainValidator(/[^\w_-]/),
    ]),
  });

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
        this.questionnaireComplianceTextfieldPlaceholders = result.filter(
          (field) => field.type === 'TEXT'
        );
      })
      .catch((err) => {
        this.alertService.errorObject(err);
      });
  }

  onSelectTextfield(textfieldPlaceholder: string): void {
    const placeholder =
      '\n<pia-consent-input-text-' +
      textfieldPlaceholder +
      '></pia-consent-input-text-' +
      textfieldPlaceholder +
      '>';
    this.placeholderSelected.emit(placeholder);
  }

  onSelectQuestionnaireComplianceTextfield(
    compliancePlaceholder: GenericFieldDescription
  ): void {
    const placeholder =
      '\n<pia-consent-input-text-generic name="' +
      compliancePlaceholder.placeholder +
      '" label="' +
      compliancePlaceholder.label +
      '"></pia-consent-input-text-generic>';
    this.placeholderSelected.emit(placeholder);
  }

  addGenericTextField(): void {
    if (this.newGenericTextfieldForm.valid) {
      this.addGenericField({
        ...this.newGenericTextfieldForm.value,
        type: 'TEXT',
      });
      this.newGenericTextfieldForm.reset();
    }
  }

  addGenericField(description: GenericFieldDescription): void {
    this.complianceService
      .addGenericField(this.studyName, description)
      .then((result) => {
        this.questionnaireComplianceTextfieldPlaceholders = result.filter(
          (field) => field.type === 'TEXT'
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
