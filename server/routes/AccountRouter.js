var express = require('express');
var router = express.Router();
var AccountController = require('../controllers/AccountController');
var Auth = require('../core/Auth');
/* GET users listing. */
// router.get('/Register',AccountController.RegisterGet);
router.post('/Register',AccountController.RegisterPost);
router.get('/VerifyEmail',AccountController.VerifyEmail);
router.get('/RequestVerifyEmail',Auth.AuthenUser,AccountController.RequestVerifyEmail);
router.post('/Login',AccountController.LoginPost);
router.get('/Login',AccountController.LoginGet);
router.post('/ChangePassword',Auth.AuthenUser,AccountController.ChangePassword);
router.post('/RequestResetPassword',AccountController.RequestResetPassword);
router.get('/VerifyResetPassword/:email/:token',AccountController.VerifyResetPasswordGet);
router.post('/VerifyResetPassword/:email/:token',AccountController.VerifyResetPasswordPost);
router.post('/Logout',Auth.AuthenUser,AccountController.LogoutPost);
router.post('/LogoutAll',Auth.AuthenUser,AccountController.LogoutAllPost);
router.get('/TestRemember',Auth.AuthenUser,AccountController.TestRemember);
router.get('/GetBasicDataUser',Auth.AuthenUser,AccountController.GetBasicDataUser);
router.get('/GetRegisterReceiveEmail',Auth.AuthenUser,AccountController.GetRegisterReceiveEmail);
router.post('/EditRegisterReceiveEmail',Auth.AuthenUser,AccountController.EditRegisterReceiveEmail);

module.exports = router;
