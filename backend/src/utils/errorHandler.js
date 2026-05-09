// errorHandler.js

const { HTTPException, AIProviderException } = require("./exceptions");

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err instanceof AIProviderException) {
    return res.status(err.statusCode).json({
      error: {
        provider: err.provider,
        code: err.statusCode,
        type: err.reason,
        message: err.message,
      },
    });
  }

  if (err instanceof HTTPException) {
    return res.status(err.statusCode).json({
      code: err.statusCode,
      reason: err.reason,
      message: err.message,
    });
  }

  return res.status(500).json({
    code: 500,
    reason: "InternalServerError",
    message: "Internal server error",
  });
}

module.exports = errorHandler;