const errorHandler = (err, req, res, next) => {
  console.error(err);

  res.status(400).json({
    message: err.message || 'Something went wrong'
  });
};

module.exports = errorHandler;
