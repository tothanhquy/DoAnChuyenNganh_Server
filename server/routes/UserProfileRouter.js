var express = require('express');
var router = express.Router();
var UserProfileController = require('../controllers/UserProfileController');
var Auth = require('../core/Auth');
/* GET users listing. */
router.get('/GetMyProfile',Auth.AuthenUser,UserProfileController.GetMyProfile);
router.get('/GetGuestProfile',UserProfileController.GetGuestProfile);
router.post('/EditInfo',Auth.AuthenUser,UserProfileController.EditInfo);
router.post('/EditSkills',Auth.AuthenUser,UserProfileController.EditSkills);
router.post('/InsertCV',Auth.AuthenUser,UserProfileController.InsertCV);
router.post('/EditCV',Auth.AuthenUser,UserProfileController.EditCV);
router.post('/EditAvatar',Auth.AuthenUser,UserProfileController.EditAvatar);
router.post('/DeleteCV',Auth.AuthenUser,UserProfileController.DeleteCV);
router.get('/ViewPDFCV',UserProfileController.ViewPDFCV);
router.post('/OwnerRequestViewPDFCV',Auth.AuthenUser,UserProfileController.OwnerRequestViewPDFCV);
module.exports = router;
