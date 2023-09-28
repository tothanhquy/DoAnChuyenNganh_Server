const bcrypt = require('bcrypt');

const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var AccountModel = require('../models/AccountModel_Old_');  
var Controller = require('./Controller');


//containt the function with business logics  
var AccountController = {  
    //http post
    RegisterPost : async function(req,res){  
        try {  
            let email = req.body.email;
            let name = req.body.name;
            let password = req.body.password;

            let passValid = AccountModel.isValidPassword(password);
            if (!passValid.isValid) {
                res.json(Controller.Fail(passValid.error));
            }

            password = await AccountModel.hashPassword(password);

            
            const accountModel = {  
                Name:name,  
                Email:email,  
                Password:password,
            };   
            let resAction = await AccountModel.registerAccount(accountModel); 
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
            } else {
                //send mail here

                //
                res.json(Controller.Success(resAction.data));
            }
            
        }  
        catch (error) {  
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http get
    RequestVerifyEmail: async (req,res) => {
        try {  
            if ((await Controller.isAuthorize(req)) == false) {
                res.json(Controller.Fail(Message(req.lang,"not_authorized")));   
            }

            let accessToken = Controller.getAccessToken(req);

            let resAction = await AccountModel.getIsVerifyEmail(accessToken.id);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
            } else {
                if (resAction.data.IsVerifyEmail == true) {
                    res.json(Controller.Fail(Message(req.lang,"email_was_verified")));   
                }
            }

            let verifyToken = Controller.generateRandomString(20) + "." + (Date.now() + AccountModel.RegisterTime);

            resAction = await AccountModel.setVerifyEmailToken(accessToken.id,verifyToken);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
            } else {
                //send mail here
                
                res.json(Controller.Success({isComplete:true}));   
            }
        }  
        catch (error) {  
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //return a message page 
    VerifyEmail : async function(req,res){  
        try {  
            let email = req.query.email;
            let verifytoken = req.query.verifytoken;

            let emailValid = AccountModel.isValidEmail(email);
            if (!emailValid.isValid) {
                res.json(Controller.Fail(emailValid.error));
            }
            
            let resAction = await AccountModel.getVerifyEmailTokenByEmail(email);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.render('message', { title: 'Error',message:resAction.error});
            } else {
                if (resAction.data.VerifyEmailToken != verifytoken || !verifytoken || verifytoken == "") {
                    res.render('message', { title: 'Error',message:"Mã không hợp lệ."});
                } else {
                    if (parseInt(verifytoken.split('.')[1]) < Date.now()) {
                        res.render('message', { title: 'Error',message:"Mã quá hạn."});
                    } else {
                        resAction = await AccountModel.verifyEmailComplete(resAction.data._id);
                        if (resAction.status == ModelResponse.ResStatus.Fail) {
                            res.render('message', { title: 'Error', message: resAction.error});
                        } else {
                            res.render('message', { title: 'Complete', message: "Xác thực thành công." });
                        }
                    }
                }
            }
        }  
        catch (error) {  
            res.render('message', { title: 'Error', message: Message(req.lang,"system_error") });
        }  
    },
    //http get
    RegisterGet(req, res) { 
        res.render('register', { title: 'Register Page'});
    },
    //http post
    LoginPost: async (req,res) => {
        try {  
            let email = req.body.email;
            let password = req.body.password;

            let emailValid = AccountModel.isValidEmail(email);
            if (!emailValid.isValid) {
                res.json(Controller.Fail(emailValid.error));
            }

            let passValid = AccountModel.isValidPassword(password);
            if (!passValid.isValid) {
                res.json(Controller.Fail(passValid.error));
            }

            let resAction = await AccountModel.getPasswordByEmail(email); 
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
            }
            //compare password
            const isMatch = await bcrypt.compare(password, resAction.data.Password);
            if (!isMatch) {
                res.json(Controller.Fail("Mật Khẩu Không Khớp"));
            }

            //general access token
            let accessToken = new Controller.AccessToken(resAction.data._id, Controller.generateRandomString(20), Date.now() + AccountModel.AccessTokenTime);
            let accessTokenString = Controller.AccessToken.encode(accessToken);
            
            resAction = await AccountModel.updateAccessToken(resAction.data._id, accessTokenString);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
            } else {
                Controller.setAccessToken(req, accessToken);
                res.json(Controller.Success({access_token:accessTokenString}));   
            }
        }  
        catch (error) {  
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http get
    LoginGet(req, res) { 
        res.render('login', { title: 'Login Page'});
    },
    //http post
    LogoutPost: async (req,res) => {
        try {  
            if ((await Controller.isAuthorize(req)) == false) {
                res.json(Controller.Success({isComplete:true}));   
            }

            let accessToken = Controller.getAccessToken(req);

            //general new access token
            accessToken.token = Controller.generateRandomString(20);
            
            let accessTokenString = Controller.AccessToken.encode(accessToken);

            let resAction = await AccountModel.updateAccessToken(accessToken.id,accessTokenString);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
            } else {
                res.json(Controller.Success({isComplete:true}));   
            }
        }  
        catch (error) {  
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },



    //http get
    TestRemember:async (req, res)=> { 
        let message = "";
        if ((await Controller.isAuthorize(req)) === true) {
            message = "Remember you!";
        } else {
            message = "Not Remember you?";
            
        }
        res.render('message', { title: 'message Page', message: message });
    },
}  
  
module.exports = AccountController;