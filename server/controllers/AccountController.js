const bcrypt = require('bcrypt');

const ViewAlert = require('../view_models/ViewAlert');
const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
const AdminUserEdit = require('../view_models/AdminUserEdit');
var AccountModel = require('../models/AccountModel');  
var Auth = require('../core/Auth');  
const Mail = require('../core/Mail');
var Controller = require('./Controller');
const AccountResponse = require('../client_data_response_models/Account');
const NotificationController = require('./NotificationController');

//containt the function with business logics  
var AccountController = {  
    //http post
    RegisterPost : async function(req,res){  
        try {  
            let email = req.body.email;
            let name = req.body.name;
            let password = req.body.password;

            //valid
            let nameValid = AccountModel.isValidName(name, req.lang);
            if (!nameValid.isValid) {
                res.json(Controller.Fail(nameValid.error));
                return;
            }

            let emailValid = AccountModel.isValidEmail(email, req.lang);
            if (!emailValid.isValid) {
                res.json(Controller.Fail(emailValid.error));
                return;
            }

            let passValid = AccountModel.isValidPassword(password, req.lang);
            if (!passValid.isValid) {
                res.json(Controller.Fail(passValid.error));
                return;
            }

            // check exist email
            let resAction = await AccountModel.getDataByEmail(email,req.lang);
            if (resAction.status != ModelResponse.ResStatus.Fail) {
                //exist
                res.json(Controller.Fail(Message(req.lang, "email_was_registered_by_other_person")));
                return;
            }

            password = await AccountModel.hashPassword(password);

            const accountModel = {  
                Name:name,  
                Email:email,  
                Password:password,
            };   
            resAction = await AccountModel.createAccount(accountModel,req.lang); 
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            } else {
                //send mail here

                //
                res.json(Controller.Success({ isComplete: true }));
                return;
            }
            
        }  
        catch (error) {  
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http get
    RequestVerifyEmail: async (req,res) => {
        try {  
            // if ((await Controller.isAuthorize(req)) == false) {
            //     res.json(Controller.Fail(Message(req.lang,"not_authorized")));   
            // }

            // let accessToken = Controller.getAccessToken(req);
            let idAccount = req.user.id;

            // let resAction = await AccountModel.getDataById(accessToken.id,req.lang);
            let resAction = await AccountModel.getDataById(idAccount,req.lang);
            let account = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                if (account.IsVerifyEmail == true) {
                    res.json(Controller.Fail(Message(req.lang, "email_was_verified")));   
                    return;
                }
            }

            let verifyToken = Controller.generateRandomString(20) + "." + (Date.now() + AccountModel.VerifyEmailTime);
            account.VerifyEmailToken = verifyToken;
            // resAction = await AccountModel.updateAccount(accessToken.id,account,req.lang);
            resAction = await AccountModel.updateAccount(idAccount,account,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                //send mail here
                let verify_url = req.protocol + "://" + req.get("host") + "/Account/VerifyEmail?verifytoken={{verify_token}}&email={{email}}";
                verify_url = verify_url.replace('{{verify_token}}', verifyToken).replace('{{email}}', account.Email);

                let content = Message(req.lang, 'verify_email_content_email_template');
                content = content
                    .replace('{{name}}', account.Name)
                    .replace('{{verify_url}}', verify_url)
                    .replace('{{token_time}}', AccountModel.VerifyEmailTime/(1000*60));

                if (await Mail.Send(account.Email, Message(req.lang, 'verify_email_title_email_template'), content)) {
                    res.json(Controller.Success({ isComplete: true }));   
                    return;
                } else {
                    res.json(Controller.Fail(Message(req.lang, "system_error")));  
                    return;
                }
            }
        }  
        catch (error) {  
            console.log(error)
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //return a message page 
    VerifyEmail : async function(req,res){  
        try {  
            res.locals.layout = './layouts/layout_user';
            let email = req.query.email;
            let verifytoken = req.query.verifytoken;

            let emailValid = AccountModel.isValidEmail(email, req.lang);
            if (!emailValid.isValid) {
                res.json(Controller.Fail(emailValid.error));
                return;
            }
            
            let resAction = await AccountModel.getDataByEmail(email, req.lang);
            let account = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.render('message', { title: 'Error', message: resAction.error });
                return;
            } else {
                if (account.VerifyEmailToken != verifytoken || !verifytoken || verifytoken == "") {
                    res.render('message', { title: 'Error', message: Message(req.lang, "token_invalid") });
                    return;
                } else {
                    if (parseInt(verifytoken.split('.')[1]) < Date.now()) {
                        res.render('message', { title: 'Error', message: Message(req.lang, "token_outdate") });
                        return;
                    } else {
                        //complete
                        account.IsVerifyEmail = true;
                        account.VerifyEmailToken = "";
                        resAction = await AccountModel.updateAccount(account._id,account,req.lang);
                        if (resAction.status == ModelResponse.ResStatus.Fail) {
                            res.render('message', { title: 'Error', message: resAction.error });
                            return;
                        } else {
                            res.render('message', { title: 'Complete', message: Message(req.lang, "verify_complete") });
                            return;
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

            let emailValid = AccountModel.isValidEmail(email, req.lang);
            if (!emailValid.isValid) {
                res.json(Controller.Fail(emailValid.error));
                return;
            }

            let passValid = AccountModel.isValidPassword(password, req.lang);
            if (!passValid.isValid) {
                res.json(Controller.Fail(passValid.error));
                return;
            }

            let resAction = await AccountModel.getDataByEmail(email, req.lang);
            let account = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            //compare password
            const isMatch = await bcrypt.compare(password, account.Password);
            if (!isMatch) {
                res.json(Controller.Fail(Message(req.lang, "password_incorrect")));
                return;
            }

            if (account.BanTime > Date.now()) {
                let userView = AdminUserEdit(account);
                res.json(Controller.Fail(Message(req.lang, "account_bantime") + userView.BanTimeString + " (UTC)"));
                return;
            }

            //general access token
            // let accessToken = new Controller.AccessToken(resAction.data._id, Controller.generateRandomString(20), Date.now() + AccountModel.AccessTokenTime);
            // let accessTokenString = Controller.AccessToken.encode(accessToken);
            let accessTokenString = Auth.SetAuth(account._id, { name: account.Name }, res);
            if (accessTokenString === false) {
                res.json(Controller.Fail(Message(req.lang, "system_error"))); 
                return;
            } else {
                account.AccessTokens.push(accessTokenString);
                resAction = await AccountModel.updateAccount(account._id, account, req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));   
                    return;
                } else {
                    // Controller.setAccessToken(req, accessToken);
                    res.json(Controller.Success({ isComplete: true }));   
                    return;
                }
                
            }
        }  
        catch (error) {  
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http get
    LoginGet(req, res) { 
        res.locals.layout = './layouts/layout_admin_guest';
        res.render('login', { req:req,title: 'Login',admin_name:'Account'});
    },
    //http post
    LogoutPost: async (req,res) => {
        try {  
            // if ((await Controller.isAuthorize(req)) == false) {
            //     res.json(Controller.Success({isComplete:true}));   
            // }

            // let accessToken = Controller.getAccessToken(req);

            // //general new access token
            // accessToken.token = Controller.generateRandomString(20);
            
            // let accessTokenString = Controller.AccessToken.encode(accessToken);

            let idAccount = req.user.id;
            let accessToken = req.user.accessToken;

            let resAction = await AccountModel.getDataById(idAccount,req.lang);
            let account = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                let ind = account.AccessTokens.indexOf(accessToken);
                if (ind !== -1) {
                    account.AccessTokens.splice(ind, 1);
    
                    resAction = await AccountModel.updateAccount(idAccount,account ,req.lang);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(resAction.error));   
                        return;
                    } else {
                        res.json(Controller.Success({ isComplete: true })); 
                        return;
                    }
                    
                } else {
                    res.json(Controller.Fail(Message(req.lang, "not_authorized")));
                    return;
                }
            }
            
        }  
        catch (error) {  
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http post
    LogoutAllPost: async (req,res) => {
        try {  
            // if ((await Controller.isAuthorize(req)) == false) {
            //     res.json(Controller.Success({isComplete:true}));   
            // }

            // let accessToken = Controller.getAccessToken(req);

            // //general new access token
            // accessToken.token = Controller.generateRandomString(20);
            
            // let accessTokenString = Controller.AccessToken.encode(accessToken);

            let idAccount = req.user.id;

            let resAction = await AccountModel.getDataById(idAccount,req.lang);
            let account = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
            } else {
                account.AccessTokens = [];
    
                resAction = await AccountModel.updateAccount(idAccount,account ,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));   
                } else {
                    res.json(Controller.Success({isComplete:true}));   
                }
                    
            }
            
        }  
        catch (error) {  
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http post
    ChangePassword: async (req,res) => {
        try {  
            // if ((await Controller.isAuthorize(req)) == false) {
            //     res.json(Controller.Fail(Message(req.lang,"not_authorized")));   
            // }

            let old_password = req.body.old_password;
            let new_password = req.body.new_password;
            
            let old_passValid = AccountModel.isValidPassword(old_password, req.lang);
            if (!old_passValid.isValid) {
                res.json(Controller.Fail(old_passValid.error));
                return;
            }
            let new_passValid = AccountModel.isValidPassword(new_password, req.lang);
            if (!new_passValid.isValid) {
                res.json(Controller.Fail(new_passValid.error));
                return;
            }

            // let accessToken = Controller.getAccessToken(req);
            let idAccount = req.user.id;
            // let resAction = await AccountModel.getDataById(accessToken.id,req.lang);
            let resAction = await AccountModel.getDataById(idAccount,req.lang);
            let account = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
            } else {
                //compare password
                const isMatch = await bcrypt.compare(old_password, account.Password);
                if (!isMatch) {
                    res.json(Controller.Fail(Message(req.lang, "password_incorrect")));
                    return;
                }
                let passwordHash = await AccountModel.hashPassword(new_password);
                account.Password = passwordHash;

                resAction = await AccountModel.updateAccount(idAccount, account,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));   
                } else {
                    res.json(Controller.Success({isComplete:true}));   
                }
            }

        }  
        catch (error) {  
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http post
    RequestResetPassword: async (req,res) => {
        try {
            let email = req.body.email;

            let emailValid = AccountModel.isValidEmail(email, req.lang);
            if (!emailValid.isValid) {
                res.json(Controller.Fail(emailValid.error));
                return;
            }

            let resAction = await AccountModel.getDataByEmail(email, req.lang);
            let account = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            if (account.IsVerifyEmail == false) {
                res.json(Controller.Fail(Message(req.lang, "email_was_not_verified")));  
                return;
            }

            let verifyToken = Controller.generateRandomString(20) + "." + (Date.now() + AccountModel.ResetPasswordTime);
            account.ResetPasswordToken = verifyToken;
            resAction = await AccountModel.updateAccount(account._id,account,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
            } else {
                //send mail here
                let urlResetPassword = req.protocol + '://' + req.get('host') + "/Account/VerifyResetPassword/" + email + "/" + verifyToken;
                // console.log(urlResetPassword);
                
                let content = Message(req.lang, 'reset_password_content_email_template');
                content = content
                    .replace('{{name}}', account.Name)
                    .replace('{{reset_password_url}}', urlResetPassword)
                    .replace('{{token_time}}', AccountModel.ResetPasswordTime/(1000*60));

                if (await Mail.Send(account.Email, Message(req.lang, 'reset_password_title_email_template'), content)) {
                    res.json(Controller.Success({isComplete:true}));   
                } else {
                    res.json(Controller.Fail(Message(req.lang,"system_error")));  
                }  
            }
        }  
        catch (error) {  
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },

    //http get
    VerifyResetPasswordGet: async (req, res) => {
        let viewMessages = [];
        let dataView = {};
        dataView.newPassword = "";
        dataView.confirmNewPassword = "";
        try {  
            res.locals.layout = './layouts/layout_admin_guest';
            let email = req.params.email;
            let token = req.params.token;
            
            let emailValid = AccountModel.isValidEmail(email, req.lang);
            if (!emailValid.isValid) {
                viewMessages.push(ViewAlert.Warning(emailValid.error));
            } else {
                let resAction = await AccountModel.getDataByEmail(email, req.lang);
                let account = resAction.data;
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    viewMessages.push(ViewAlert.Warning(resAction.error));
                } else {
                    if (account.IsVerifyEmail == false) {
                        viewMessages.push(ViewAlert.Warning(Message(req.lang,"email_was_not_verified")));
                    }else if (!token || token == "" || token != account.ResetPasswordToken) {
                        viewMessages.push(ViewAlert.Warning(Message(req.lang,"token_invalid")));
                    } else {
                        if (parseInt(token.split('.')[1]) < Date.now()) {
                            viewMessages.push(ViewAlert.Warning(Message(req.lang,"token_outdate")));
                        } else { 
                            //token valid
                            
                        }
                    }
                }
            }
        }  
        catch (error) {  
            viewMessages.push(ViewAlert.Warning(Message(req.lang, "system_error")));
        }  
        res.render('reset_password', { req:req,title: 'Reset Password',view_messages: viewMessages, data: dataView});
    },
    //http post
    VerifyResetPasswordPost: async (req, res) => {
        let viewMessages = [];
        let dataView = {};
        dataView.newPassword = "";
        dataView.confirmNewPassword = "";
        try {  
            res.locals.layout = './layouts/layout_admin_guest';
            let email = req.params.email;
            let token = req.params.token;
            let new_password = req.body.new_password;
            dataView.newPassword = new_password;
            let confirm_new_password = req.body.confirm_new_password;
            dataView.confirmNewPassword = confirm_new_password;
            
            let emailValid = AccountModel.isValidEmail(email, req.lang);
            if (!emailValid.isValid) {
                viewMessages.push(ViewAlert.Warning(emailValid.error));
            } else if (confirm_new_password !== new_password) {
                viewMessages.push(ViewAlert.Warning(Message(req.lang,"confirm_password_not_right")));
            } else{
                let resAction = await AccountModel.getDataByEmail(email, req.lang);
                let account = resAction.data;
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    viewMessages.push(ViewAlert.Warning(resAction.error));
                } else {
                    if (!token || token == "" || token != account.ResetPasswordToken) {
                        viewMessages.push(ViewAlert.Warning(Message(req.lang,"token_invalid")));
                    } else {
                        if (parseInt(token.split('.')[1]) < Date.now()) {
                            viewMessages.push(ViewAlert.Warning(Message(req.lang,"token_outdate")));
                        } else { 
                            //token valid
                            let new_passValid = AccountModel.isValidPassword(new_password, req.lang);
                            if (!new_passValid.isValid) {
                                viewMessages.push(ViewAlert.Warning(new_passValid.error));
                            } else {
                                let passwordHash = await AccountModel.hashPassword(new_password);
                                account.Password = passwordHash;
                                account.ResetPasswordToken = "";

                                resAction = await AccountModel.updateAccount(account._id, account,req.lang);
                                if (resAction.status == ModelResponse.ResStatus.Fail) {
                                    viewMessages.push(ViewAlert.Warning(resAction.error));
                                } else {
                                    viewMessages.push(ViewAlert.Success(Message(req.lang,"reset_password_success")));
                                }
                            }
                        }
                    }
                }
            }
        }  
        catch (error) {  
            viewMessages.push(ViewAlert.Warning(Message(req.lang, "system_error")));
        }  
        res.render('reset_password', { req:req,title: 'Reset Password',view_messages: viewMessages, data: dataView});
    },

    //http get
    TestRemember: async (req, res) => { 
        res.locals.layout = './layouts/layout_admin_guest';
        let message = "";
        message = "Remember you!";
        res.render('message', { req:req,title: 'message Page', message: message });
    },
    //http get
    GetBasicDataUser: async (req, res) => { 
        try {
            let idAccount = req.user.id;

            let resAction = await AccountModel.getDataById(idAccount,req.lang);
            let account = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
            } else {
                let resData = new AccountResponse.BasicDataUser();
                resData.name = account.Name;
                resData.avatar = account.Avatar;
                resData.isVerifyEmail = account.IsVerifyEmail;
                resData.numberNotReadNotifications = await NotificationController.getNumberTotalNotReadNotificationsOfUser(req,idAccount);
                res.json(Controller.Success(resData));
            }
        }  
        catch (error) {  
            console.log(error)
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    
}  
  
module.exports = AccountController;