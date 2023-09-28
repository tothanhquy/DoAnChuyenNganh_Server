var express = require('express');
var router = express.Router();
var PostController = require('../controllers/PostController');
var Auth = require('../core/Auth');
/* GET users listing. */
router.post('/Create',Auth.AuthenUser,PostController.Create);
router.get('/GetList',PostController.GetList);
router.post('/Update', Auth.AuthenUser, PostController.Update);

module.exports = router;
