const Message = require('../../messages/Messages');
const ModelResponse = require('../../models/ModelResponse');
const ViewAlert = require('../../view_models/ViewAlert');
const AdminUserEdit = require('../../view_models/AdminUserEdit');
var AccountModel = require('../../models/AccountModel');  
var Controller = require('../Controller');


//containt the function with business logics  
var AdminUsersController = { 

    //http get
    UserList: async (req,res) => {
        try {  
            // if ((await Controller.isAuthorizeAdmin(req)) == false) {
            //     res.redirect("../../Account/Login");  
            // }
            // let accessToken = Controller.getAccessToken(req);
            // let resAction = await AccountModel.getDataById(accessToken.id,req.lang);
            // let accountAdmin = resAction.data;
            // if (resAction.status == ModelResponse.ResStatus.Fail) {
            //     res.send("Error");    
            // }
            let accountAdminName = req.user.userData.name;

            let viewMessages = [];
            let dataView = {search:{},users:[]};
            let { search_string, authorize_status } = req.query;
            if (search_string === undefined) search_string = "";
            dataView.search.string = search_string;

            if (authorize_status === undefined) authorize_status = "all";
            dataView.search.authorize_status = authorize_status;
            
            let timeNow = Date.now();
            let banTimeObject;
            if (dataView.search.authorize_status=="all") {
                banTimeObject = { BanTime: { $gte: 0 } };//get all
            }else if (dataView.search.authorize_status=="ban") {
                banTimeObject = { BanTime: { $gt: timeNow } };
            }else if (dataView.search.authorize_status=="not_ban") {
                banTimeObject = { BanTime: { $lte: timeNow } };
            }else{
                banTimeObject = { BanTime: { $lt: 0 } };//get empty
            }

            let conditionObject = {
                $and: [
                    {
                        IsAdmin: false
                    },
                    {
                        $or: [
                            {
                                Name:{$regex:'.*'+search_string+'.*',$options: 'i'}
                            }, {
                                Email:{$regex:'.*'+search_string+'.*',$options: 'i'}                                
                            }
                        ]
                    },banTimeObject
                ]

            };

            resAction = await AccountModel.getAllUsersByAdmin(conditionObject,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                viewMessages.push(ViewAlert.Danger("Can not load list of users."));  
            } else {
                dataView.users = resAction.data;
            }
            if (dataView.users) {
                dataView.users = dataView.users.map(a =>AdminUserEdit(a));
            }
            res.render('users/list', { req: req, title: 'Users', admin_name: accountAdminName, view_messages: viewMessages, data: dataView});

        }  
        catch (error) {  
            res.send("Error");   
        }  
    },
    //http get
    EditGet: async (req,res) => {
        try {  
            
            // if ((await Controller.isAuthorizeAdmin(req)) == false) {
            //     res.redirect("../../../Account/Login");  
            // }
            // let accessToken = Controller.getAccessToken(req);
            // let resAction = await AccountModel.getDataById(accessToken.id,req.lang);
            // let accountAdmin = resAction.data;
            // if (resAction.status == ModelResponse.ResStatus.Fail) {
            //     res.send("Error");    
            // }
            let accountAdminName = req.user.userData.name;

            let viewMessages = [];
            let viewUser = null;
            //get id
            let id = ""+req.params.id;
            resAction = await AccountModel.getDataById(id,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                viewMessages.push(ViewAlert.Danger(resAction.error));  
            } else {
                if (resAction.data.IsAdmin === true) {
                    viewMessages.push(ViewAlert.Danger(Message(req.lang,"account_is_not_user")));
                } else {
                    viewUser = AdminUserEdit(resAction.data);  
                }
            }
            res.render('users/edit', { req: req, title: 'Edit User', admin_name: accountAdminName, view_messages: viewMessages, data: viewUser});

        }  
        catch (error) {  
            res.send("Error");   
        }  
    },
    //http post
    EditPost: async (req,res) => {
        try {  
            
            // if ((await Controller.isAuthorizeAdmin(req)) == false) {
            //     res.redirect("../../../Account/Login");  
            // }
            // let accessToken = Controller.getAccessToken(req);
            // let resAction = await AccountModel.getDataById(accessToken.id,req.lang);
            // let accountAdmin = resAction.data;
            // if (resAction.status == ModelResponse.ResStatus.Fail) {
            //     res.send("Error");    
            // }
            let accountAdminName = req.user.userData.name;

            let viewMessages = [];
            //get id
            let id = "" + req.params.id;
            let viewUser = null;

            resAction = await AccountModel.getDataById(id,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                viewMessages.push(ViewAlert.Danger(resAction.error));  
            } else {
                if (resAction.data.IsAdmin === true) {
                    viewMessages.push(ViewAlert.Danger(Message(req.lang,"account_is_not_user")));
                } else {
                    let editAccount = resAction.data; 
                    viewUser = AdminUserEdit(editAccount);
                    viewUser.BanTimeString = req.body.ban_time;
                    let time = Date.parse(req.body.ban_time);
                    //time zone
                    time = Date.parse(req.body.ban_time);
                    time = new Date(new Date(time).getTime() - new Date(time).getTimezoneOffset() * 60 * 1000).getTime();

                    if (isNaN(time)) {
                        viewMessages.push(ViewAlert.Warning(Message(req.lang,"datetime_is_unvalid")));
                    } else {
                        editAccount.BanTime = time;
                        resAction = await AccountModel.updateAccount(id,editAccount,req.lang);
                        if (resAction.status == ModelResponse.ResStatus.Fail) {
                            viewMessages.push(ViewAlert.Danger(resAction.error));  
                        } else {
                            viewMessages.push(ViewAlert.Success("Update Success!"));                          
                        }
                    }
                }
            }
            res.render('users/edit', { req: req, title: 'Edit User', admin_name: accountAdminName, view_messages: viewMessages, data: viewUser});
        }  
        catch (error) {  
            res.send("Error");   
        }  
    },
}  
  
module.exports = AdminUsersController;