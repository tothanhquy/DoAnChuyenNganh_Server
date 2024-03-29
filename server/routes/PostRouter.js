var express = require('express');
var router = express.Router();
var PostController = require('../controllers/PostController');
var Auth = require('../core/Auth');
/* GET users listing. */
router.post('/Create',Auth.AuthenUser,PostController.Create);
router.get('/GetList',PostController.GetList);
router.post('/UserInterRact', Auth.AuthenUser, PostController.UserInterRact);
router.post('/LogFastVisit', Auth.AuthenUser, PostController.LogFastVisit);
router.get('/Details', PostController.Details);
router.post('/OwnerUpdate', Auth.AuthenUser, PostController.OwnerUpdate);
router.post('/OwnerDelete', Auth.AuthenUser, PostController.OwnerDelete);
router.get('/OwnerGetEditInfo', Auth.AuthenUser, PostController.OwnerGetEditInfo);

module.exports = router;
