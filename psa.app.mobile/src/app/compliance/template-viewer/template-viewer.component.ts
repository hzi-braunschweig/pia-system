import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ContainerForFormControlUsageComponent } from './container-for-form-control-usage.component';
import { TemplateSegment } from '../segment.model';

@Component({
  selector: 'app-template-viewer',
  templateUrl: './template-viewer.component.html',
  styleUrls: ['./template-viewer.component.scss'],
})
export class TemplateViewerComponent extends ContainerForFormControlUsageComponent {
  @Input()
  public segments: TemplateSegment[];
  @Input()
  public form: FormGroup;
}
