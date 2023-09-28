var express = require('express');
var router = express.Router();
const expressLayouts = require('express-ejs-layouts');

router.use(expressLayouts);
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { req:req,name_admin:"admin",title: 'Express'});
});

module.exports = router;
