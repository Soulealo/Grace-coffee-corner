function sanitizeValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeValue);

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !key.startsWith('$') && !key.includes('.'))
        .map(([key, nested]) => [key, sanitizeValue(nested)])
    );
  }

  if (typeof value === 'string') return value.trim();
  return value;
}

function sanitizeInput(req, res, next) {
  req.body = sanitizeValue(req.body || {});
  req.query = sanitizeValue(req.query || {});
  next();
}

module.exports = sanitizeInput;
