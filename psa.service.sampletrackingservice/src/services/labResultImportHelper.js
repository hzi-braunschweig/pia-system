const { config } = require('../config');
const stream = require('stream');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);
const SftpAllFilesDownloadStream = require('./download-stream/sftpAllFilesDownloadStream');
const ParseHl7FilesToLabResultsStream = require('./download-stream/parseHl7FilesToLabResultsStream');
const ParseCsvFilesToLabResultsStream = require('./download-stream/parseCsvFilesToLabResultsStream');
const StoreLabResultsStream = require('./download-stream/storeLabResultsStream');
const SftpDeleteImportedFilesStream = require('./download-stream/sftpDeleteImportedFilesStream');

class LabResultImportHelper {
  static importHl7FromMhhSftp() {
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
        console.log(err);
        return 'error';
      });
  }

  static importCsvFromHziSftp() {
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
        console.log(err);
        return 'error';
      });
  }
}

module.exports = LabResultImportHelper;
