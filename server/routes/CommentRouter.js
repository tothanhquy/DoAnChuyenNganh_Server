var express = require('express');
var router = express.Router();
var CommentController = require('../controllers/CommentController');
var Auth = require('../core/Auth');
/* GET users listing. */
router.post('/CreateComment',Auth.AuthenUser,CommentController.CreateComment);
router.get('/GetComments',CommentController.GetComments);
router.post('/UserInteract', Auth.AuthenUser, CommentController.UserInteract);

module.exports = router;
