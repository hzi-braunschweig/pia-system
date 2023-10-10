/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Client from 'ssh2-sftp-client';
import { Readable } from 'stream';
import { SftpConfig } from '../../models/sftpConfig';

/**
 * A readable stream that reads the content of each file of a sftp server
 * and pushes the file content in object mode as one "chunk" into the stream.
 */
export class SftpAllFilesDownloadStream extends Readable {
  private static readonly MAX_DOWNLOAD_SIZE = 100000;
  private static readonly TAG = 'LAB RESULT IMPORT - FILE DOWNLOADER:';
  private readonly sftpConfig: SftpConfig;
  private readonly client: Client = new Client();
  private initialized = false;
  private filePaths: AsyncGenerator<string, void> | undefined;

  public constructor(sftpConfig: SftpConfig) {
    super({ objectMode: true });
    this.sftpConfig = sftpConfig;
  }

  /**
   * The initialization before starting the reading:
   * Connecting to sftp server and creating the file path iterator.
   */
  public async _construct(
    callback: (error?: Error | null | undefined) => void
  ): Promise<void> {
    console.log(SftpAllFilesDownloadStream.TAG, 'Initialize download stream');
    try {
      console.log(
        SftpAllFilesDownloadStream.TAG,
        'Connecting to:',
        this.sftpConfig.host,
        '...'
      );
      await this.client.connect(this.sftpConfig);
      console.log(SftpAllFilesDownloadStream.TAG, 'Connection established.');
      this.filePaths = this.getFilePaths();
      this.initialized = true;
      callback();
    } catch (err) {
      console.log(SftpAllFilesDownloadStream.TAG, 'Connect failed', err);
      this.destroy(err as Error);
      callback(err as Error);
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
        console.log(SftpAllFilesDownloadStream.TAG, 'Connection closed.');
      }
      callback();
    } catch (e) {
      callback(e as Error);
    }
  }

  /**
   * One reading cycle, that downloads a file and pushes its content to the stream
   */
  public async _read(): Promise<void> {
    if (!this.filePaths) {
      console.log(SftpAllFilesDownloadStream.TAG, 'Nothing to download.');
      this.push(null);
      return;
    }
    let pushedNextFile;
    do {
      let nextPath: IteratorResult<string, void>;
      try {
        nextPath = await this.filePaths.next();
      } catch (e) {
        // connection is broken -> throw error and break up
        this.destroy(e as Error);
        return;
      }
      if (nextPath.done) {
        console.log(SftpAllFilesDownloadStream.TAG, 'All files downloaded.');
        this.push(null);
        return;
      }
      const path = nextPath.value;
      try {
        const binContent = await this.client.get(path);
        console.log(
          SftpAllFilesDownloadStream.TAG,
          'Download succeeded:',
          path
        );
        this.push({ path, content: binContent.toString('utf-8') });
        pushedNextFile = true;
      } catch (e) {
        pushedNextFile = false;
        console.log(
          SftpAllFilesDownloadStream.TAG,
          'Download failed:',
          path,
          e
        );
      }
    } while (!pushedNextFile);
  }

  /**
   * Generator function to create the iterator over all files in a sftp folder and sub folders.
   */
  private async *getFilePaths(path = '/'): AsyncGenerator<string> {
    const dirEntries = await this.client.list(path);
    for (const entry of dirEntries) {
      if (entry.type === 'd') {
        yield* this.getFilePaths(path + entry.name + '/');
      } else if (
        entry.type === '-' &&
        entry.size < SftpAllFilesDownloadStream.MAX_DOWNLOAD_SIZE
      ) {
        // ignore files greater than 100 kB (hl7 or csv files are usually about 1-2 kB in size)
        yield path + entry.name;
      } else {
        console.log(
          SftpAllFilesDownloadStream.TAG,
          'Ignore:',
          path + entry.name,
          'SIZE:',
          entry.size
        );
      }
    }
  }
}
