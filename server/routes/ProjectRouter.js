var express = require('express');
var router = express.Router();
var ProjectController = require('../controllers/ProjectController');
var Auth = require('../core/Auth');
/* GET users listing. */

router.post('/Create',Auth.AuthenUser,ProjectController.Create);
router.post('/EditAvatar',Auth.AuthenUser,ProjectController.EditAvatar);
router.get('/GetMyProjectsAndInvitingRequest',Auth.AuthenUser,ProjectController.GetMyProjectsAndInvitingRequest);
router.get('/Details',ProjectController.Details);
router.post('/EditBasicInfo',Auth.AuthenUser,ProjectController.EditBasicInfo);
router.get('/GetEditBasicInfo',Auth.AuthenUser,ProjectController.GetEditBasicInfo);
router.post('/EditTags',Auth.AuthenUser,ProjectController.EditTags);
router.post('/ToggleFollow',Auth.AuthenUser,ProjectController.ToggleFollow);
router.post('/VoteStar',Auth.AuthenUser,ProjectController.VoteStar);
router.get('/GetTags',Auth.AuthenUser,ProjectController.GetTags);
router.post('/EditTags',Auth.AuthenUser,ProjectController.EditTags);
router.get('/GetMyVoteStar',Auth.AuthenUser,ProjectController.GetMyVoteStar);
router.post('/ExitProject',Auth.AuthenUser,ProjectController.ExitProject);
router.get('/GetMembersNow',ProjectController.GetMembersNow);
router.get('/GetMembersHistory',ProjectController.GetMembersHistory);
router.post('/DeleteMember',Auth.AuthenUser,ProjectController.DeleteMember);
router.post('/UpdateMemberRole',Auth.AuthenUser,ProjectController.UpdateMemberRole);
router.post('/InviteNewMember',Auth.AuthenUser,ProjectController.InviteNewMember);
router.post('/UpdateInvitingMember',Auth.AuthenUser,ProjectController.UpdateInvitingMember);
router.get('/GetInvitingMembersOfProject',Auth.AuthenUser,ProjectController.GetInvitingMembersOfProject);
router.get('/GetInvitingMembersOfUser',Auth.AuthenUser,ProjectController.GetInvitingMembersOfUser);
router.get('/GetCategoryKeywordsOfProject',Auth.AuthenUser,ProjectController.GetCategoryKeywordsOfProject);
router.post('/UpdateCategoryKeywordsOfProject',Auth.AuthenUser,ProjectController.UpdateCategoryKeywordsOfProject);
router.get('/GetResources',ProjectController.GetResources);
router.post('/UploadResource',Auth.AuthenUser,ProjectController.UploadResource);
router.post('/DeleteResource',Auth.AuthenUser,ProjectController.DeleteResource);
router.post('/UpdateNegativeReports',Auth.AuthenUser,ProjectController.UpdateNegativeReports);
router.get('/GetMyNegativeReports',Auth.AuthenUser,ProjectController.GetMyNegativeReports);
router.get('/GetGeneralNegativeReports',ProjectController.GetGeneralNegativeReports);


module.exports = router;
