/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { config } from '../config';
import stream from 'stream';
import util from 'util';
import { SftpAllFilesDownloadStream } from './download-stream/sftpAllFilesDownloadStream';
import { ParseHl7FilesToLabResultsStream } from './download-stream/parseHl7FilesToLabResultsStream';
import { ParseCsvFilesToLabResultsStream } from './download-stream/parseCsvFilesToLabResultsStream';
import { StoreLabResultsStream } from './download-stream/storeLabResultsStream';
import { SftpDeleteImportedFilesStream } from './download-stream/sftpDeleteImportedFilesStream';

const pipeline = util.promisify(stream.pipeline);

export class LabResultImportHelper {
  public static async importHl7FromMhhSftp(): Promise<string> {
    const downloadStream = new SftpAllFilesDownloadStream(
      config.servers.mhhftpserver
    );
    const parseStream = new ParseHl7FilesToLabResultsStream();
    const storeStream = new StoreLabResultsStream();
    const deleteStream = new SftpDeleteImportedFilesStream(
      config.servers.mhhftpserver
    );

    return pipeline(downloadStream, parseStream, storeStream, deleteStream)
      .then(() => 'success')
      .catch((err) => {
        console.log('Error in hl7 import pipeline:', err);
        return 'error';
      });
  }

  public static async importCsvFromHziSftp(): Promise<string> {
    const downloadStream = new SftpAllFilesDownloadStream(
      config.servers.hziftpserver
    );
    const parseStream = new ParseCsvFilesToLabResultsStream();
    const storeStream = new StoreLabResultsStream();
    const deleteStream = new SftpDeleteImportedFilesStream(
      config.servers.hziftpserver
    );

    return pipeline(downloadStream, parseStream, storeStream, deleteStream)
      .then(() => 'success')
      .catch((err) => {
        console.log('Error in csv import pipeline:', err);
        return 'error';
      });
  }
}
