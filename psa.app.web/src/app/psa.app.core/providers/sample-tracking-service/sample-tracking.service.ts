/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { BloodSample, LabResult } from '../../models/labresult';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Questionnaire } from '../../models/questionnaire';
import { LabResultTemplate } from '../../models/labresultTemplate';
import { firstValueFrom } from 'rxjs';
import { LabObservationName } from '../../models/labObservationName';

@Injectable()
export class SampleTrackingService {
  private readonly apiUrl = 'api/v1/sample/';

  constructor(private http: HttpClient) {}

  async getLabResultTemplate(studyName: string): Promise<LabResultTemplate> {
    return firstValueFrom(
      this.http.get<LabResultTemplate>(
        this.apiUrl + `studies/${studyName}/labResultTemplate`
      )
    );
  }

  async updateLabResultTemplate(
    studyName: string,
    labResultTemplate: LabResultTemplate
  ) {
    return firstValueFrom(
      this.http.put<LabResultTemplate>(
        this.apiUrl + `studies/${studyName}/labResultTemplate`,
        labResultTemplate
      )
    );
  }

  /**
   * Return a list with laboratory results for proband
   * @param  id Proband Id
   * @return list with laboratory results
   */
  async getAllLabResultsForUser(id): Promise<LabResult[]> {
    return firstValueFrom(
      this.http.get<LabResult[]>(this.apiUrl + `probands/${id}/labResults`)
    );
  }

  /**
   * Return a list with laboratory results for one sample id ... sounds weird, sure this is right?
   * @param  sampleID Proband Id
   * @return list with laboratory results
   */
  getLabResultsForSampleID(sampleID): Promise<LabResult> {
    return firstValueFrom(
      this.http.get<LabResult>(this.apiUrl + `labResults/${sampleID}`)
    );
  }

  /**
   * Returns laboratory observations for specific labor result for user as HTML
   * @param userID the users ID == pseudonym
   * @param resultID the ID of the laboratory-result
   * @return a html string as a presentation of the laboratory result
   */
  getLabResultObservationForUser(userID, resultID): Promise<string> {
    const headers = new HttpHeaders({
      Accept: 'text/html',
    });
    return firstValueFrom(
      this.http.get(this.apiUrl + `probands/${userID}/labResults/${resultID}`, {
        headers,
        responseType: 'text',
      })
    );
  }

  /**
   * Returns a list of distinct laboratory observation names
   * @return a html string as a presentation of the laboratory result
   */
  getLabObservationNames(): Promise<LabObservationName[]> {
    return firstValueFrom(
      this.http.get<LabObservationName[]>(this.apiUrl + `labObservations/names`)
    );
  }

  /**
   * Update single lab result
   * @param probandID  Id of the proband
   * @param resultID Id of the laboratory result
   * @param newData data you want to update
   */
  putLabResult(
    probandID: string,
    resultID: string,
    newData: {
      remark?: string;
      new_samples_sent?: boolean;
      date_of_sampling?: string | Date;
      dummy_sample_id?: string;
      status?: string;
    }
  ): Promise<LabResult> {
    return firstValueFrom(
      this.http.put<LabResult>(
        this.apiUrl + `probands/${probandID}/labResults/${resultID}`,
        newData
      )
    );
  }

  /**
   * Creates lab result
   * @param probandID  Id of the proband
   * @param labResult The laboratory result
   */
  postLabResult(probandID: string, labResult): Promise<LabResult> {
    return firstValueFrom(
      this.http.post<LabResult>(
        this.apiUrl + `probands/${probandID}/labResults`,
        labResult
      )
    );
  }

  /**
   * Return a list with blood samples for proband
   * @param  probandID Proband Id
   * @return list with blood samples
   */
  getAllBloodSamplesForUser(probandID): Promise<BloodSample[]> {
    return firstValueFrom(
      this.http.get<BloodSample[]>(
        this.apiUrl + `probands/${probandID}/bloodSamples`
      )
    );
  }

  /**
   * Return a list with blood samples for one blood sample id ... sounds weird, sure this is right?
   * @param  sampleID The blood sample's Id
   * @return list with blood samples
   */
  getBloodSamplesForBloodSampleID(sampleID): Promise<LabResult[]> {
    return firstValueFrom(
      this.http.get<LabResult[]>(this.apiUrl + `bloodResult/${sampleID}`)
    );
  }

  /**
   * Update single lab result
   * @param probandID  Id of the proband
   * @param sampleID Id of the blood sample
   * @param newData data you want to update
   */
  putBloodSample(
    probandID: string,
    sampleID: string,
    newData: { remark?: string; blood_sample_carried_out?: boolean }
  ): Promise<object> {
    return firstValueFrom(
      this.http.put(
        this.apiUrl + `probands/${probandID}/bloodSamples/${sampleID}`,
        newData
      )
    );
  }

  /**
   * Creates blood sample
   * @param probandID  Id of the proband
   * @param bloodSample The blood sample
   */
  postBloodSample(probandID: string, bloodSample): Promise<object> {
    return firstValueFrom(
      this.http.post(
        this.apiUrl + `probands/${probandID}/bloodSamples`,
        bloodSample
      )
    );
  }

  /**
   * Updates Sample Status and Sample Date for a sample id
   *
   * @param sampleID sample Id
   * @param dummySampleId a Bact-sample ID ... whatever that is
   */
  updateSampleStatusAndSampleDateFor(
    sampleID: string,
    dummySampleId: string,
    pseudonym: string
  ): Promise<LabResult> {
    const data = {
      remark: '', // will be ignored from back end
      new_samples_sent: true, // will be ignored from backend
      date_of_sampling: new Date(), // only relevant information for background
      dummy_sample_id: dummySampleId ? dummySampleId : undefined,
    };
    return this.putLabResult(pseudonym, sampleID, data);
  }

  public async requestMaterialForProband(
    pseudonym: string
  ): Promise<Questionnaire> {
    return firstValueFrom(
      this.http.post<Questionnaire>(
        `${this.apiUrl}probands/${pseudonym}/needsMaterial`,
        {}
      )
    );
  }
}
