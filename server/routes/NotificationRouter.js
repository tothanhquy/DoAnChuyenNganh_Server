var express = require('express');
var router = express.Router();
var NotificationController = require('../controllers/NotificationController');
var Auth = require('../core/Auth');
/* GET users listing. */
router.get('/GetNotificationsOfUser',Auth.AuthenUser,NotificationController.GetNotificationsOfUser);
router.get('/GetNotification',Auth.AuthenUser,NotificationController.GetNotification);
router.post('/UserRead',Auth.AuthenUser,NotificationController.UserRead);

module.exports = router;
