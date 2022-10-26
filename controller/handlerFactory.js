const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/errorHandler');

exports.deleteOne = (
  Model //doc avilable in inner function because of closure
) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return next(new AppError('No document found in this Id', 404));
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return next(new AppError('No document found in this Id', 404));
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: { doc },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions); //populate the data
    const doc = await query;
    if (!doc) {
      return next(new AppError('NO Tour In This Id', 404));
    }
    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId }; //small hack for nexted route
    const features = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .fields()
      .paginate();
    const doc = await features.query;
    res.status(200).json({
      status: 'OK',
      results: doc.length,
      data: doc,
    });
  });
