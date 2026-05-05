function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const err = new Error('Forbidden: insufficient role');
      err.status = 403;
      return next(err);
    }

    return next();
  };
}

module.exports = requireRole;
