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
