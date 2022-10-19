const express = require('express');
const authController = require('../controller/authController');

const router = express.Router();

router.route('/signup').post(authController.signUp);
router.route('/signin').post(authController.login);
router.route('/forgotPassword').post(authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);
router
  .route('/updateMe')
  .patch(authController.protect, authController.updateMe);
router
  .route('/deleteMe')
  .delete(authController.protect, authController.deleteMe);

router
  .route('/updatePassword')
  .patch(authController.protect, authController.updatePassword);

module.exports = router;
