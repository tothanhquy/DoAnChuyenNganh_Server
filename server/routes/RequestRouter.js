var express = require('express');
var router = express.Router();
var RequestController = require('../controllers/RequestController');
var Auth = require('../core/Auth');
/* GET users listing. */
router.post('/Create',Auth.AuthenUser,RequestController.Create);
router.get('/GetList',Auth.AuthenUser,RequestController.GetList);
router.get('/Details',Auth.AuthenUser,RequestController.Details);
router.post('/Update', Auth.AuthenUser, RequestController.Update);

module.exports = router;
