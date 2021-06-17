import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { LabResult, SampleAnswer } from './lab-result.model';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';

@Injectable({
  providedIn: 'root',
})
export class SampleTrackingClientService {
  private getApiUrl() {
    return this.endpoint.getUrl() + '/api/v1/sample/';
  }

  constructor(private http: HttpClient, private endpoint: EndpointService) {}

  putSampleAnswer(
    userId,
    labResultId,
    putData: SampleAnswer
  ): Promise<LabResult> {
    return this.http
      .put<LabResult>(
        this.getApiUrl() + 'probands/' + userId + '/labResults/' + labResultId,
        putData
      )
      .toPromise();
  }

  getUserLabResults(userId: string): Promise<LabResult[]> {
    return this.http
      .get<LabResult[]>(this.getApiUrl() + 'probands/' + userId + '/labResults')
      .toPromise();
  }

  /**
   * Returns laboratory observations for specific lab result for user as HTML
   */
  getLabResultForUser(userId: string, labResultId: string): Promise<string> {
    const headers = new HttpHeaders({ Accept: 'text/html' });
    return this.http
      .get(this.getApiUrl() + `probands/${userId}/labResults/${labResultId}`, {
        headers,
        responseType: 'text',
      })
      .toPromise();
  }
}
