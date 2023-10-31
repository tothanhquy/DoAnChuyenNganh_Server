var express = require('express');
var router = express.Router();
var ChanelChatController = require('../controllers/ChanelChatController');
var Auth = require('../core/Auth');
/* GET users listing. */
router.post('/CreateGroup',Auth.AuthenUser,ChanelChatController.CreateGroup);
router.get('/GetChanelChatsOfUser',Auth.AuthenUser,ChanelChatController.GetChanelChatsOfUser);
router.get('/GetMembers',Auth.AuthenUser,ChanelChatController.GetMembers);
router.get('/Details',Auth.AuthenUser,ChanelChatController.Details);
router.post('/EditGroupChatName', Auth.AuthenUser, ChanelChatController.EditGroupChatName);
router.post('/EditGroupChatImage', Auth.AuthenUser, ChanelChatController.EditGroupChatImage);
router.post('/DeleteMemberOfGroup', Auth.AuthenUser, ChanelChatController.DeleteMemberOfGroup);
router.post('/ExitGroupChat', Auth.AuthenUser, ChanelChatController.ExitGroupChat);
router.post('/InsertMembers', Auth.AuthenUser, ChanelChatController.InsertMembers);
router.post('/UserSeen', Auth.AuthenUser, ChanelChatController.UserSeen);

module.exports = router;
