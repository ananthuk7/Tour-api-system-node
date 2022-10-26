const express = require('express');
const tourController = require('../controller/tourController');
const authController = require('../controller/authController');
const reviewRouter = require('./reviewRouter');

const router = express.Router();

router.use('/:tourId/review', reviewRouter);
// router.param('id', tourController.checkId);

router.route('/top-5-cheap').get(tourController.alias, tourController.getTours);
router.route('/tour-stat').get(tourController.aggregateGroup);
router
  .route('/monthly-plan/:year')
  .get(authController.protect, tourController.getMonthlyPlan);
router
  .route('/')
  .get(tourController.getTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
router
  .route('/:id')
  .get(tourController.getTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  )
  .put(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  );
router
  .route('/tours-within/:distance/startFrom/:latlon/unit/:unit')
  .get(tourController.getToursWithin);
router.route('/distances/:latlon/unit/:unit').get(tourController.distances);
module.exports = router;
