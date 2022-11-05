const express = require('express');
const authController = require('../controller/authController');

const router = express.Router();

router.route('/signup').post(authController.signUp);
router.route('/signin').post(authController.login);
router.route('/logout').get(authController.logout);
router.route('/forgotPassword').post(authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);

router.use(authController.protect);
router
  .route('/updateMe')
  .patch(
    authController.userImageUpload,
    authController.resizeUSerPhoto,
    authController.updateMe
  );
router.route('/me').get(authController.getMe, authController.getUser);
router.route('/deleteMe').delete(authController.deleteMe);
router.route('/updatePassword').patch(authController.updatePassword);

router.use(authController.restrictTo('admin')); //user get delete and update under admin
router.route('/').get(authController.userList);
router.route('/:id').delete(authController.deleteUser);

module.exports = router;
