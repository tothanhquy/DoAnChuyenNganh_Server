var express = require('express');
var router = express.Router();
var SkillController = require('../controllers/SkillController');
/* GET users listing. */
router.get('/GetSkills',SkillController.GetSkills);
module.exports = router;
