const { SearchesInteractor } = require('../interactors/searchesInteractor');

const searchesHandler = (function () {
  async function createOne(request, h) {
    try {
      request.log(['export'], 'Start export');
      const stream = await SearchesInteractor.createSearch(
        request.auth.credentials,
        request.payload
      );
      stream.on('end', () => {
        request.log(['export'], 'Export finished.');
        request.log(['export'], 'Downloaded ' + stream.pointer() + ' Bytes');
      });
      stream.on('warning', (err) => {
        request.log(['export'], 'Warning in export:');
        request.log(['export'], err);
      });
      stream.on('error', (err) => {
        request.log(['export'], 'Export failed with Error:');
        request.log(['export'], err);
      });
      return h.response(stream).type('application/zip');
    } catch (err) {
      request.log(['export'], 'Export failed');
      request.log(err);
      return err;
    }
  }

  return {
    /**
     * creates a data search and returns the search result
     * @param request {import('@hapi/hapi').Request}
     * @param h {import('@hapi/hapi').ResponseToolkit}
     * @return {Promise<*>}
     */
    createOne: createOne,
  };
})();

module.exports = searchesHandler;
