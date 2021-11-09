/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Client from 'ssh2-sftp-client';
import { Writable } from 'stream';
import { SftpConfig } from '../../models/sftpConfig';
import { ImportFile } from '../../models/ImportFile';

export class SftpDeleteImportedFilesStream extends Writable {
  private static readonly TAG = 'LAB RESULT IMPORT - FILE DELETER:';
  private readonly sftpConfig: SftpConfig;
  private readonly client = new Client();
  private initialized = false;

  public constructor(sftpConfig: SftpConfig) {
    super({ objectMode: true });
    this.sftpConfig = sftpConfig;
  }

  /**
   * The initialization before starting the reading (automatically called from node v15):
   * Connecting to sftp server.
   */
  public async _construct(): Promise<void> {
    console.log(
      SftpDeleteImportedFilesStream.TAG,
      'Initialize deletion stream'
    );
    try {
      console.log(
        SftpDeleteImportedFilesStream.TAG,
        'Connecting to:',
        this.sftpConfig.host,
        '...'
      );
      await this.client.connect(this.sftpConfig);
      console.log(SftpDeleteImportedFilesStream.TAG, 'Connection established.');
      this.initialized = true;
    } catch (err) {
      this.destroy(err as Error);
    }
  }

  /**
   * Closes the sftp connection after all files are downloaded
   */
  public async _destroy(
    _error: Error | null,
    callback: (error?: Error | null) => void
  ): Promise<void> {
    try {
      if (this.initialized) {
        await this.client.end();
        console.log(SftpDeleteImportedFilesStream.TAG, 'Connection closed.');
      }
      callback();
    } catch (e) {
      callback(e as Error);
    }
  }

  public async _write(
    file: ImportFile,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): Promise<void> {
    if (!this.initialized) {
      await this._construct();
    }
    // for now only delete files with lab results of samples that are assigned to a user.
    if (
      file.success === 'imported_for_existing_sample' ||
      file.success === 'existing_sample_already_had_labresult'
    ) {
      try {
        // non implemented parameter in @types/ssh2-sftp-client
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await this.client.delete(file.path, true);
        console.log(
          SftpDeleteImportedFilesStream.TAG,
          'Successfully imported file deleted:',
          file.path
        );
      } catch (e) {
        console.log(
          SftpDeleteImportedFilesStream.TAG,
          'Deletion of successfully imported file failed:',
          file.path,
          e
        );
      }
    } else {
      console.log(
        SftpDeleteImportedFilesStream.TAG,
        'The lab result of this file could not be assigned to a user so it will not be deleted:',
        file.path
      );
    }
    callback();
  }
}
