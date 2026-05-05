function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((item) => item.message).join(', ');
    return res.status(400).json({ error: message || 'Validation failed' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id format' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate value already exists' });
  }

  return res.status(err.status || 500).json({
    error: err.message || 'Server error'
  });
}

module.exports = errorHandler;
