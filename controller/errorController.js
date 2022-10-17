const ApiError = require('../utils/errorHandler');

const handleCastErrorDb = (err) => {
  const message = `invalid ${err.path} : ${err.value}`;
  return new ApiError(message, 400);
};
const handleDuplicatFieldDb = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
  const message = `duplicate field value: ${value} please use another value`;
  return new ApiError(message, 400);
};
const handleVlidationErrorDb = (err) => {
  const errors = Object.values(err.errors)
    .map((el) => el.message)
    .join('. ');
  const message = errors;
  return new ApiError(message, 400);
};
const sendErrorDec = (err, res) => {
  //send error in development
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrorProd = (err, res) => {
  //send error in productionF
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('Error', err);
    res.status(500).json({
      status: 'error',
      message: 'something went wrong',
    });
  }
};
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDec(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.name === 'CastError') error = handleCastErrorDb(error);
    if (error.code === 11000) error = handleDuplicatFieldDb(error);
    if (error.code === 'ValidationError') error = handleVlidationErrorDb(error);
    sendErrorProd(error, res);
  }
  res.status(err.statusCode).send({
    status: err.status,
    message: err.message,
  });
};
