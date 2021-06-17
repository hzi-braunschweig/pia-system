import { Component } from '@angular/core';

import { AuthService } from '../../auth/auth.service';
import { SampleTrackingClientService } from '../sample-tracking-client.service';
import { LabResult } from '../lab-result.model';

@Component({
  selector: 'app-lab-result-list',
  templateUrl: './lab-result-list.page.html',
})
export class LabResultListPage {
  labResults: LabResult[] = null;

  constructor(
    private auth: AuthService,
    private sampleTrackingClient: SampleTrackingClientService
  ) {
    this.fetchLabResults();
  }

  isEmpty() {
    return this.labResults && !this.labResults.length;
  }

  private async fetchLabResults() {
    try {
      const labResults = await this.sampleTrackingClient.getUserLabResults(
        this.auth.getCurrentUser().username
      );
      this.labResults = labResults.filter((result) => result.status !== 'new');
    } catch (error) {
      this.labResults = [];
      console.error(error);
    }
  }
}
