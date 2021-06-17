import { Component } from '@angular/core';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';

@Component({
  templateUrl: 'probands.component.html',
  styleUrls: ['probands.component.scss'],
})
export class ProbandsComponent {
  constructor(public auth: AuthenticationManager) {}
}
