const validator = require('validator');

const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  return validator.escape(validator.trim(value));
};

const sanitizeAuthInput = (body) => {
  const sanitized = { ...body };
  if (sanitized.email) {
    sanitized.email = validator.normalizeEmail(validator.trim(sanitized.email)) || sanitized.email;
  }
  if (sanitized.name) {
    sanitized.name = sanitizeString(sanitized.name);
  }
  return sanitized;
};

module.exports = { sanitizeString, sanitizeAuthInput };
