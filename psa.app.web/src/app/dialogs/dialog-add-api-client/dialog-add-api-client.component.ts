/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { UserService } from '../../psa.app.core/providers/user-service/user.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-dialog-add-api-client',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatDialogModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './dialog-add-api-client.component.html',
  styleUrls: ['./dialog-add-api-client.component.scss'],
})
export class DialogAddApiClientComponent {
  public readonly form = new FormGroup({
    name: new FormControl('', Validators.required),
    studies: new FormControl([], Validators.required),
  });

  public readonly selectableStudies = this.userService
    .getStudies$()
    .pipe(map((studies) => studies.map((s) => s.name)));

  constructor(private readonly userService: UserService) {}
}
