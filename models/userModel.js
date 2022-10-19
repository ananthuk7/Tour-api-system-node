const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'name fileld requires'], trim: true },
  email: {
    type: String,
    required: [true, 'email fileld requires'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'admin', 'guide', 'lead-guide'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'password fileld required'],
    minLength: 8,
    select: false,
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'password must be same',
    },
  },
  confirmPassword: {
    type: String,
    required: [true, 'confirmPassword fileld required'],
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcryptjs.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});
userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
  next();
});
//for login
userSchema.methods.correctPassword = async function (
  candidatPassword,
  userPassword
) {
  return await bcryptjs.compare(candidatPassword, userPassword);
};
userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    ); //for geting in seconds
    return JWTTimestamp < changedTimeStamp;
  }
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //*60 for second *1000 for ms
  return resetToken;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
