var express = require('express');
var router = express.Router();
var MessageController = require('../controllers/MessageController');
var Auth = require('../core/Auth');
/* GET users listing. */
router.post('/CreateMessage',Auth.AuthenUser,MessageController.CreateMessage);
router.get('/GetMessagesOfChanelChat',Auth.AuthenUser,MessageController.GetMessagesOfChanelChat);
router.get('/GetMessagesOfChanelChatBetweenTime',Auth.AuthenUser,MessageController.GetMessagesOfChanelChatBetweenTime);

module.exports = router;
