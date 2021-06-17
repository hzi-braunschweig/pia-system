const Client = require('ssh2-sftp-client');
const { Writable } = require('stream');

const TAG = 'LAB RESULT IMPORT - FILE DELETER:';

class SftpDeleteImportedFilesStream extends Writable {
  constructor(sftpConfig) {
    super({ objectMode: true });
    this.sftpConfig = sftpConfig;
    this.client = new Client();
    this.initialized = false;
  }

  /**
   * The initialization before starting the reading (automatically called from node v15):
   * Connecting to sftp server.
   * @return {Promise<void>}
   * @private
   */
  async _construct() {
    console.log(TAG, 'Initialize deletion stream');
    try {
      console.log(TAG, 'Connecting to:', this.sftpConfig.host, '...');
      await this.client.connect(this.sftpConfig);
      console.log(TAG, 'Connection established.');
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
   *
   * @param {ImportFile} file
   * @param encoding
   * @param callback
   * @return {Promise<void>}
   * @private
   */
  async _write(file, encoding, callback) {
    if (!this.initialized) {
      await this._construct();
    }
    // for now only delete files with lab results of samples that are assigned to a user.
    if (
      file.success === 'imported_for_existing_sample' ||
      file.success === 'existing_sample_already_had_labresult'
    ) {
      try {
        await this.client.delete(file.path, true);
        console.log(TAG, 'Successfully imported file deleted:', file.path);
        callback();
      } catch (e) {
        console.log(
          TAG,
          'Deletion of successfully imported file failed:',
          file.path,
          e
        );
      }
    }
  }
}

module.exports = SftpDeleteImportedFilesStream;
