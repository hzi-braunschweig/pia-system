/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { AlertService } from '../../../_services/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalDataService } from 'src/app/psa.app.core/providers/personaldata-service/personaldata-service';
import { PersonalData } from '../../../psa.app.core/models/personalData';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  templateUrl: 'proband-personal-info.component.html',
  styleUrls: ['proband-personal-info.component.scss'],
})
export class ProbandPersonalInfoComponent implements OnInit {
  probandId: string;
  probandForm: FormGroup;
  anreden = ['Frau', 'Herr'];

  constructor(
    private activatedRoute: ActivatedRoute,
    private alertService: AlertService,
    private router: Router,
    private location: Location,
    private personalDataService: PersonalDataService
  ) {}

  async ngOnInit(): Promise<void> {
    this.probandId = this.activatedRoute.snapshot.paramMap.get('username');

    try {
      const probandData = await this.personalDataService.getPersonalDataFor(
        this.probandId
      );
      this.initForm(probandData);
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        this.initForm();
      } else {
        this.alertService.errorObject(err);
      }
    }
  }

  public initForm(probandData?: PersonalData): void {
    this.probandForm = new FormGroup({
      anrede: new FormControl(probandData?.anrede, Validators.maxLength(10)),
      titel: new FormControl(probandData?.titel, Validators.maxLength(50)),
      vorname: new FormControl(probandData?.vorname, Validators.maxLength(100)),
      name: new FormControl(probandData?.name, Validators.maxLength(100)),
      strasse: new FormControl(probandData?.strasse, Validators.maxLength(200)),
      haus_nr: new FormControl(probandData?.haus_nr, Validators.maxLength(100)),
      plz: new FormControl(probandData?.plz, [
        Validators.pattern('[0-9]+'),
        Validators.maxLength(10),
      ]),
      landkreis: new FormControl(
        probandData?.landkreis,
        Validators.maxLength(30)
      ),
      ort: new FormControl(probandData?.ort, Validators.maxLength(100)),
      telefon_privat: new FormControl(probandData?.telefon_privat, [
        Validators.pattern('[0-9]+'),
        Validators.maxLength(255),
      ]),
      telefon_dienst: new FormControl(probandData?.telefon_dienst, [
        Validators.pattern('[0-9]+'),
        Validators.maxLength(255),
      ]),
      telefon_mobil: new FormControl(probandData?.telefon_mobil, [
        Validators.pattern('[0-9]+'),
        Validators.maxLength(255),
      ]),
      email: new FormControl(probandData?.email, [
        Validators.email,
        Validators.maxLength(255),
      ]),
      comment: new FormControl(probandData?.comment),
    });
  }

  goBackInHistory(): void {
    this.location.back();
  }

  saveChanges(): void {
    this.probandForm.markAllAsTouched();
    if (this.probandForm.valid) {
      this.personalDataService
        .putPersonalDataFor(this.probandId, this.probandForm.value)
        .then(() => this.router.navigate(['/probands-personal-info/']))
        .catch((err) => this.alertService.errorObject(err));
    }
  }
}
