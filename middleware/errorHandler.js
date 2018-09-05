const errorHandler = (error, req, res, next) => {
  console.log(error);

  // If you call next() with an error after you have started writing the response
  // the Express default error handler closes the connection and fails the request.
  // So when you add a custom error handler, you must delegate to the default Express error handler,
  // when the headers have already been sent to the client

  if (res.headersSent) {
    console.log(
      "------------------------------------------------------------------"
    );

    return next(error);
  }
  res.status(error.status || 500).json({
    errors: {
      global: error.message
    }
  });
};

module.exports = errorHandler;
