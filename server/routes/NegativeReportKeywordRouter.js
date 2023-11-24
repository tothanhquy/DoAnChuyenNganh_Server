var express = require('express');
var router = express.Router();
var NegativeReportKeywordController = require('../controllers/NegativeReportKeywordController');
/* GET users listing. */
router.get('/GetList',NegativeReportKeywordController.GetList);
module.exports = router;
