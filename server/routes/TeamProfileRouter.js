var express = require('express');
var router = express.Router();
var TeamProfileController = require('../controllers/TeamProfileController');
var Auth = require('../core/Auth');
/* GET users listing. */

router.post('/Create',Auth.AuthenUser,TeamProfileController.Create);
router.post('/EditAvatar',Auth.AuthenUser,TeamProfileController.EditAvatar);
router.get('/GetMyTeams',Auth.AuthenUser,TeamProfileController.GetMyTeams);
router.get('/GetTeamsByLeader',Auth.AuthenUser,TeamProfileController.GetTeamsByLeader);
router.get('/DetailsTeam',TeamProfileController.DetailsTeam);
router.post('/EditInfo',Auth.AuthenUser,TeamProfileController.EditInfo);
router.post('/ExitTeam',Auth.AuthenUser,TeamProfileController.ExitTeam);
router.get('/GetMembers',TeamProfileController.GetMembers);
router.post('/DeleteMember',Auth.AuthenUser,TeamProfileController.DeleteMember);


module.exports = router;
