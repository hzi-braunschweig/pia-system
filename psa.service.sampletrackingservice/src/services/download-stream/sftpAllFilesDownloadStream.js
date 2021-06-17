const Client = require('ssh2-sftp-client');
const { Readable } = require('stream');

const TAG = 'LAB RESULT IMPORT - FILE DOWNLOADER:';

/**
 * A readable stream that reads the content of each file of a sftp server
 * and pushes the file content in object mode as one "chunk" into the stream.
 */
class SftpAllFilesDownloadStream extends Readable {
  constructor(sftpConfig) {
    super({ objectMode: true });
    this.sftpConfig = sftpConfig;
    this.client = new Client();
    this.initialized = false;
  }

  /**
   * The initialization before starting the reading (automatically called from node v15):
   * Connecting to sftp server and creating the file path iterator.
   * @return {Promise<void>}
   * @private
   */
  async _construct() {
    console.log(TAG, 'Initialize download stream');
    try {
      console.log(TAG, 'Connecting to:', this.sftpConfig.host, '...');
      await this.client.connect(this.sftpConfig);
      console.log(TAG, 'Connection established.');
      this.filePaths = this._getFilePaths();
      this.initialized = true;
    } catch (err) {
      this.destroy(err);
    }
  }

  /**
   * Closes the sftp connection after all files are downloaded
   * @return {Promise<void>}
   * @private
   */
  async _destroy(error, callback) {
    try {
      if (this.initialized) {
        await this.client.end();
        console.log(TAG, 'Connection closed.');
      }
      callback();
    } catch (e) {
      callback(e);
    }
  }

  /**
   * Generator function to create the iterator over all files in a sftp folder and sub folders.
   * @param path
   * @return {AsyncGenerator<string, void, *>}
   * @private
   */
  async *_getFilePaths(path = '/') {
    const dirEntries = await this.client.list(path);
    for (const entry of dirEntries) {
      if (entry.type === 'd') {
        for await (const file of this._getFilePaths(path + entry.name + '/')) {
          yield file;
        }
      } else if (entry.type === '-' && entry.size < 100000) {
        // ignore files greater than 100 kB (hl7 or csv files are usually about 1-2 kB in size)
        yield path + entry.name;
      } else {
        console.log(TAG, 'Ignore:', path + entry.name, 'SIZE:', entry.size);
      }
    }
  }

  /**
   * One reading cycle, that downloads a file and pushes its content to the stream
   * @return {Promise<void>}
   * @private
   */
  async _read() {
    if (!this.initialized) {
      await this._construct();
    }
    let pathEntry;
    try {
      pathEntry = await this.filePaths.next();
    } catch (e) {
      this.destroy(e);
      return;
    }
    const path = pathEntry.value;
    if (path) {
      try {
        const binContent = await this.client.get(path);
        console.log(TAG, 'Download succeeded:', path);
        this.push({ path, content: binContent.toString('utf-8') });
      } catch (e) {
        console.log(TAG, 'Download failed:', path, e);
      }
    } else {
      console.log(TAG, 'All files downloaded.');
      this.push(null);
    }
  }
}

module.exports = SftpAllFilesDownloadStream;
