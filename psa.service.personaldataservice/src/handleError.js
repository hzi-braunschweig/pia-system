const { Boom, boomify } = require('@hapi/boom');

module.exports = function handleError(request, message, err) {
  if (err instanceof Boom) {
    throw err;
  } else {
    request.log(
      'error',
      message + ' ' + err.stack + JSON.stringify(err, null, 2)
    );
    throw boomify(err);
  }
};
