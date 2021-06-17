import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SampleTrackingService } from '../../../psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../../../psa.app.core/models/user';

@Component({
  selector: 'app-laboratory-result-details',
  templateUrl: './laboratory-result-details.component.html',
  styleUrls: ['./laboratory-result-details.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LaboratoryResultDetailsComponent implements OnInit {
  user_id: string = this.activatedRoute.snapshot.queryParamMap.get('user_id');
  isLoading = true;
  labResultHtml: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private translate: TranslateService,
    private sampleTrackingService: SampleTrackingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser: User = JSON.parse(localStorage.getItem('currentUser'));
    const resultID = this.activatedRoute.snapshot.paramMap.get('id');

    this.sampleTrackingService
      .getLabResultObservationForUser(
        this.user_id ? this.user_id : currentUser.username,
        resultID
      )
      .then((res) => {
        this.labResultHtml = res;
        this.isLoading = false;
      });
  }

  onBackButtonClicked(): void {
    if (this.user_id) {
      this.router.navigate(['/laboratory-results/', { user_id: this.user_id }]);
    } else {
      this.router.navigate(['/laboratory-results']);
    }
  }
}
