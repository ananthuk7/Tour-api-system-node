const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const tourRouter = require('./routes/tourRoutes');
const reviewRouter = require('./routes/reviewRouter');
const bookingRouter = require('./routes/bookingRouter');
const userRouter = require('./routes/userRouter');
const viewRouter = require('./routes/viewRouter');

const ApiError = require('./utils/errorHandler');
const errorHandlerMiddleware = require('./controller/errorController');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

//set security http headers
app.use(helmet());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
//limit the requests
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from Ip ,please try in one hour',
});
app.use('/api', limiter);
//body parser
app.use(express.json({ limit: 'kb' }));
app.use(express.urlencoded({ extended: true, limit: 'kb' })); //extended true for work with complex data
app.use(cookieParser());
//data sanitization for nosql injection
app.use(mongoSanitize());
//data sanitization for xss
app.use(xss());
//prevent parameter pollution :-> duplicating parameters
app.use(
  hpp({
    whitelist: ['duration'],
  })
);

// app.use((req, res, next) => {
//   console.log(req.headers);
//   next();
// });
// app.get('/', (req, res, next) => {
//   res.status(200).render('base');
// });

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/review', reviewRouter);
app.use('/api/v1/booking/', bookingRouter);
app.use('/api/v1/users/', userRouter);

app.all('*', (req, res, next) => {
  next(new ApiError(`not found ${req.originalUrl}`, 404));
});

app.use(errorHandlerMiddleware);
module.exports = app;
