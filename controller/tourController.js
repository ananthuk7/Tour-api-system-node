// const fs = require('fs');
const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/errorHandler');

// const tour = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkId = (req, res, next, val) => {
//   if (req.params.id * 1 > tour.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid Id',
//     });
//   }
//   next();
// };
exports.alias = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.checkBody = (req, res, next, val) => {
  if (!req.body.name || !req.body.price) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid name or price',
    });
  }
  next();
};

exports.getTours = catchAsync(async (req, res, next) => {
  // const queryObj = { ...req.query };
  // const excludeQuery = ['sort', 'page', 'fields', 'limit'];
  // excludeQuery.forEach((el) => delete queryObj[el]);
  // let stringQuery = JSON.stringify(queryObj);
  // stringQuery = JSON.parse(
  //   stringQuery.replace(/\b(gte|lte|lt|gt)\b/g, (match) => `$${match}`)
  // );
  // let query = Tour.find(stringQuery);

  //SOrting
  // if (req.query.sort) {
  //   const sortBy = req.query.sort.split(',').join(' ');
  //   query = query.sort(sortBy);
  // } else {
  //   query = query.sort('-createdAt');
  // }
  //limiting fields
  // if (req.query.fields) {
  //   const fieldsBy = req.query.fields.split(',').join(' ');
  //   query = query.select(fieldsBy);
  // } else {
  //   query = query.select('-__v'); //- for excluding
  // }
  //paginations
  // const page = req.query.page * 1;
  // const limit = req.query.limit * 1;
  // const skip = limit * (page - 1);
  // if (req.query.page) {
  //   const countTours = await Tour.countDocuments();

  //   if (skip >= countTours) throw new Error('page not avilable');
  // }
  // query = query.skip(skip).limit(limit);
  const features = new ApiFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .fields()
    .paginate();
  const tours = await features.query;
  res.status(200).json({
    status: 'OK',
    results: tours.length,
    data: { tours },
  });
});
exports.createTour = catchAsync(async (req, res, next) => {
  const tourData = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    tour: tourData,
  });
});
exports.getTour = catchAsync(async (req, res, next) => {
  const tourData = await Tour.findById(req.params.id);
  if (!tourData) {
    return next(new ApiError('NO Tour In This Id', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tourData,
    },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tourData = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tourData) return next(new ApiError('NO Tour In This Id', 404));
  res.status(200).json({
    status: 'success',
    data: {
      tourData,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tourData = await Tour.findByIdAndDelete(req.params.id);
  res.status(200).json({
    status: 'success',
    data: {
      tourData,
    },
  });
});

exports.aggregateGroup = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingQuantity' },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    {
      $match: {
        _id: { $ne: 'EASY' },
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    numOfStat: stats.length,
    data: {
      stats,
    },
  });
});
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numberOfTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    { $addFields: { month: '$_id' } },
    { $project: { _id: 0 } },
    {
      $sort: {
        numberOfTours: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    numberOfPlans: plan.length,
    data: {
      plan,
    },
  });
});
