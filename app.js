const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const ApiError = require('./utils/errorHandler');
const errorHandlerMiddleware = require('./controller/errorController');

const app = express();

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

// app.use((req, res, next) => {
//   console.log('Hello World fro server sideF');
//   next();
// });

app.use('/api/v1/tours', tourRouter);
app.all('*', (req, res, next) => {
  next(new ApiError(`not found ${req.originalUrl}`, 404));
});

app.use(errorHandlerMiddleware);
module.exports = app;
