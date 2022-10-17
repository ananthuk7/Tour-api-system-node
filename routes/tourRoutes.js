const express = require('express');
const tourController = require('../controller/tourController');

const router = express.Router();

// router.param('id', tourController.checkId);

router.route('/top-5-cheap').get(tourController.alias, tourController.getTours);
router.route('/tour-stat').get(tourController.aggregateGroup);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);
router
  .route('/')
  .get(tourController.getTours)
  .post(tourController.checkBody, tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .delete(tourController.deleteTour)
  .put(tourController.updateTour);

module.exports = router;
