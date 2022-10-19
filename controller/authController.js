const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/errorHandler');
const sendEmail = require('../utils/email');

const getUserToken = (id) =>
  //jwt.signin(payload,secret-key must be 32 length,options)
  jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
const sendOrCreateToken = (user, statusCode, res) => {
  const token = getUserToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({ status: 'success', token, data: { user } });
};
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
    confirmPassword: req.body.confirmPassword,
  }); //helps to prevent unwanted admin create
  sendOrCreateToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //check the email is empty or not
  if (!email || !password) {
    return next(new AppError('email or password cannot be empty', 400));
  }
  //check the user exists and
  const user = await User.findOne({ email }).select('+password'); //({ email }) => ({email: email}) in ES6
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  sendOrCreateToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //Getting the token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('Invalid user please Sign in', 401));
  }
  const { id, iat } = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );
  //find the user exists in

  const freshUser = await User.findById(id);

  if (!freshUser) {
    return next(new AppError('user not found please signup', 401));
  }

  //check if user password after the token issued
  if (freshUser.changePasswordAfter(iat)) {
    return next(
      new AppError('user recently changed password please login again', 401)
    );
  }
  //GRANT ACCES FOR PROTECTED ROUTE
  req.user = freshUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('unautherized user', 403));
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //check the email is valid
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('no user exists in this email', 404));
  }
  //Generate random resetToken
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //send it to user email
  const resetLink = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/user/resetpassword/${resetToken}`;
  const message = `Forget your password? Submit a patch request to your new password and confirmPassword to: ${resetLink}.\nIf you didn't forget your mail please ignore it`;
  try {
    await sendEmail({
      email: user.email,
      subject: `Your password reset valid for 10 min`,
      message,
    });
  } catch (e) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError(`some server problems`, 500));
  }
  sendOrCreateToken(user, 200, res);
});

/* The above code is resetting the password for the user. */
exports.resetPassword = catchAsync(async (req, res, next) => {
  //get user based on token
  const resetToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: resetToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('password reset expired', 400));
  }
  //if token has not expired and there is a user set the password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //update changed password properly for user
  //Log the user in ,send JWT
  sendOrCreateToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.correctPassword(req.body.oldPassword, user.password))) {
    return next(new AppError('no user found with old password', 401));
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  sendOrCreateToken(user, 200, res);
});
const getFilterFields = (oldObj, ...requiredFields) => {
  const newObj = {};
  Object.keys(oldObj).forEach((field) => {
    if (requiredFields.includes(field)) {
      newObj[field] = oldObj[field];
    }
  });
  return newObj;
};
exports.updateMe = catchAsync(async (req, res, next) => {
  const filterFields = getFilterFields(req.body, 'name', 'email');
  const user = await User.findByIdAndUpdate(req.user.id, filterFields, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ status: 'success', data: { user } });
});
exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({ status: 'success', data: { user: null } });
});
