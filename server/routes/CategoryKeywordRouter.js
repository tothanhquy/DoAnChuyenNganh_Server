var express = require('express');
var router = express.Router();
var CategoryKeywordController = require('../controllers/CategoryKeywordController');
/* GET users listing. */
router.get('/GetList',CategoryKeywordController.GetList);
module.exports = router;
