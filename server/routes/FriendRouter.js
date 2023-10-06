var express = require('express');
var router = express.Router();
var FriendController = require('../controllers/FriendController');
var Auth = require('../core/Auth');
/* GET users listing. */
router.post('/Create',Auth.AuthenUser,FriendController.Create);
router.get('/GetFriendsOfUser',Auth.AuthenUser,FriendController.GetFriendsOfUser);
router.get('/GetFriendRequests',Auth.AuthenUser,FriendController.GetFriendRequests);
router.get('/Details',Auth.AuthenUser,FriendController.Details);
router.post('/Response', Auth.AuthenUser, FriendController.Response);
router.post('/CancelFriend', Auth.AuthenUser, FriendController.CancelFriend);

module.exports = router;
