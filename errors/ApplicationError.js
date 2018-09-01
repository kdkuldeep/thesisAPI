class ApplicationError extends Error {
  constructor(message, status, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Parameters
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError);
    }

    this.name = this.constructor.name;

    // Custom error fields
    this.message = message || "Something went wrong. Please try again.";
    this.status = status || 500;
  }
}

module.exports = ApplicationError;
