// const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
// const ApiFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/errorHandler');
const factory = require('./handlerFactory');

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
const muterStorage = multer.memoryStorage(); // for croping the image
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('please use an image for upload', 400), false);
  }
};

// const upload = multer({ dest: 'public/img/users' }); simple

const upload = multer({ storage: muterStorage, fileFilter: multerFilter }); //complex file upload

exports.tourImageUpload = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  //cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.body.imageCover}`);

  //images
  req.body.images = [];
  req.files.images.map(async (file, i) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
    await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${filename}`);
    req.body.images.push(filename);
  });
  next();
});
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

// exports.getTours = catchAsync(async (req, res, next) => {
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
//   const features = new ApiFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .fields()
//     .paginate();
//   const tours = await features.query;
//   res.status(200).json({
//     status: 'OK',
//     results: tours.length,
//     data: { tours },
//   });
// });

exports.getTours = factory.getAll(Tour);
exports.createTour = factory.createOne(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

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
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
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
      $unwind: '$startDates', //for destructuring the array of dates
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
        _id: { $month: '$startDates' }, //$month for extract month from dates
        numberOfTours: { $sum: 1 },
        tours: { $push: '$name' }, //$push for push into array
      },
    },
    { $addFields: { month: '$_id' } }, //month get the value of id
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

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlon, unit } = req.params;
  const radius = unit === 'mi' ? distance / 3963 : distance / 6378.1; //radius of earth in miles 3963 and6378.1 in kilometers
  const [lat, lng] = latlon.split(',');
  if (!lat || !lng)
    return next(
      new AppError('Please provide a lat and lon in correct format', 400)
    );
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: tours,
  });
});
exports.distances = catchAsync(async (req, res, next) => {
  const { latlon, unit } = req.params;
  const [lat, lng] = latlon.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(new AppError('Please provide a lat and lon in correct format', 400));
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: distances,
  });
});
