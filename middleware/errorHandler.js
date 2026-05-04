function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((item) => item.message).join(', ');
    return res.status(400).json({ error: message || 'Мэдээлэл буруу байна' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: 'Давхардсан мэдээлэл байна' });
  }

  return res.status(err.status || 500).json({
    error: err.message || 'Серверийн алдаа'
  });
}

module.exports = errorHandler;
