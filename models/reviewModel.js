const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: 'string',
      trim: true,
      required: [true, 'tour must have a review'],
    },
    rating: { type: Number, min: 0, max: 5 },
    createdAt: {
      type: Date,
      select: false,
      default: Date.now(),
    },
    tour: {
      type: [mongoose.Schema.ObjectId],
      ref: 'Tour',
      required: [true, 'review must have a review'],
    },
    user: {
      type: [mongoose.Schema.ObjectId],
      ref: 'User',
      required: [true, 'review must have a user'],
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
reviewSchema.statics.calculateAverageRating = async function (tourId) {
  //aggregate for calculating average and count of reviews
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuantity: stats[0].nRating,
      ratingAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuantity: 0,
      ratingAverage: 4.5,
    });
  }
};
reviewSchema.index({ tour: 1, review: 1 }, { unique: true }); // this index will only allow one review for the users
reviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.tour);
});
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne(); // findOne =>for getting the current one //this.r for aviliable in post method
  next();
});
reviewSchema.post(/^findOneAnd/, async function (next) {
  //await this.findOne(); doesnot work here, query was alredy executed
  await this.r.constructor.calculateAverageRating(this.r.tour);
});
reviewSchema.pre(/find/, function (next) {
  // this.populate({ path: 'tour', select: 'name' }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
