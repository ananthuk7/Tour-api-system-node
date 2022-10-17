const mongoose = require('mongoose');
// const slugify = require('slugify');

const userSchema = new mongoose.Schema({
  name: String,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
