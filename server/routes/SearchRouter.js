var express = require('express');
var router = express.Router();
var SearchController = require('../controllers/SearchController');
/* GET users listing. */
router.get('/SearchUserTeamProject',SearchController.SearchUserTeamProject);
module.exports = router;
