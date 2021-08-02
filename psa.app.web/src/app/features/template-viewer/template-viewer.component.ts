/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input } from '@angular/core';
import { TemplateSegment } from '../../psa.app.core/models/Segments';
import { FormGroup } from '@angular/forms';
import { ContainerForFormControlUsageComponent } from './container-for-form-control-usage.component';

@Component({
  selector: 'app-template-viewer',
  templateUrl: './template-viewer.component.html',
})
export class TemplateViewerComponent extends ContainerForFormControlUsageComponent {
  @Input()
  public segments: TemplateSegment[];
  @Input()
  public form: FormGroup;
}
