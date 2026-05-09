// exceptions.js

class HTTPException extends Error {
  constructor(statusCode, reason, message) {
    super(message);
    this.statusCode = statusCode;
    this.reason = reason;
    this.message = message;
    Error.captureStackTrace(this, this.constructor);
  }
}

class AIProviderException extends HTTPException {
  constructor(provider, statusCode, reason, message) {
    super(statusCode, reason, message);
    this.provider = provider; // "gemma" or "qwen"
  }
}

function createHTTPException(statusCode, reason, defaultMessage) {
  return class extends HTTPException {
    constructor(message = defaultMessage) {
      super(statusCode, reason, message);
    }
  };
}

const AlreadyExistsException = createHTTPException(409, "AlreadyExists", "Already exists");
const ConflictException = createHTTPException(409, "Conflict", "Conflict with existing resource");
const NotFoundException = createHTTPException(404, "NotFound", "Not found");
const UnauthorizedException = createHTTPException(401, "Unauthorized", "Unauthorized");
const ForbiddenException = createHTTPException(403, "Forbidden", "Forbidden");
const InvalidException = createHTTPException(422, "Invalid", "Invalid input");
const BadRequestException = createHTTPException(400, "BadRequest", "Bad request");
const InternalServerErrorException = createHTTPException(500, "InternalServerError", "Internal server error");
const ServiceUnavailableException = createHTTPException(503, "ServiceUnavailable", "Service unavailable");
const GatewayTimeoutException = createHTTPException(504, "GatewayTimeout", "Gateway timeout");

function raiseErrors(response, data) {
  const statusCode = response.status;

  const error = normalizeError(statusCode, data);

  switch (statusCode) {
    case 404:
      throw new NotFoundException(error.message);
    case 409:
      if (error.reason === "AlreadyExists") {
        throw new AlreadyExistsException(error.message);
      }
      throw new ConflictException(error.message);
    case 401:
      throw new UnauthorizedException(error.message);
    case 403:
      throw new ForbiddenException(error.message);
    case 422:
      throw new InvalidException(error.message);
    case 400:
      throw new BadRequestException(error.message);
    case 500:
      throw new InternalServerErrorException(error.message);
    case 503:
      throw new ServiceUnavailableException(error.message);
    case 504:
      throw new GatewayTimeoutException(error.message);
    default:
      throw new HTTPException(
        statusCode || 500,
        error.reason || "Unknown",
        error.message || "Unknown error"
      );
  }
}

async function raiseIfResponseError(response) {
  if (response.status < 400) return;

  let data;

  try {
    data = await response.json();
  } catch {
    data = {
      code: response.status,
      reason: "Unknown",
      message: await response.text(),
    };
  }

  raiseErrors(response, data);
}

function normalizeError(statusCode, data) {
  if (!data) {
    return {
      code: statusCode,
      reason: "Unknown",
      message: "Unknown error",
    };
  }

  // { error: { message: "...", code: "...", type: "..." } }
  if (data.error && typeof data.error === "object") {
    return {
      code: statusCode,
      reason: data.error.type || data.error.code || "AIProviderError",
      message: data.error.message || "AI provider error",
    };
  }

  // { code: 400, reason: "BadRequest", message: "..." }
  return {
    code: data.code || statusCode,
    reason: data.reason || "Unknown",
    message: data.message || "Unknown error",
  };
}

module.exports = {
  HTTPException,
  AIProviderException,

  AlreadyExistsException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  InvalidException,
  BadRequestException,
  InternalServerErrorException,
  ServiceUnavailableException,
  GatewayTimeoutException,

  raiseIfResponseError,
};