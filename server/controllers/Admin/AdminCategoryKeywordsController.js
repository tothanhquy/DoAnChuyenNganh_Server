const Message = require('../../messages/Messages');
const ModelResponse = require('../../models/ModelResponse');
const ViewAlert = require('../../view_models/ViewAlert');
const Path = require('path');
var CategoryKeywordModel = require('../../models/CategoryKeywordModel');  
var Controller = require('../Controller');


//containt the function with business logics  
var AdminCategoryKeywordsController = { 

    //http get, authen admin
    List: async (req,res) => {
        try {
            let accountAdminName = req.user.userData.name;

            let viewMessages = [];
            let dataView = { keywords: [], filter: {} };
            if (req.query.sort_type === undefined) {
                dataView.filter.sortType = "date_des";
            } else {
                dataView.filter.sortType = req.query.sort_type;
            }

            resAction = await CategoryKeywordModel.getAllCategoryKeywords(req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                viewMessages.push(ViewAlert.Danger("Can not load list of category keywords."));  
            } else {
                dataView.keywords = resAction.data;
                //sort
                switch (dataView.filter.sortType) {
                    case "date_des": {
                        dataView.keywords.sort((a, b) => Controller.sortFunc(a.ActionTime, b.ActionTime, 1));
                        break;
                    }
                    case "date_inc": {
                        dataView.keywords.sort((a, b) => Controller.sortFunc(a.ActionTime, b.ActionTime, -1));
                        break;
                    }
                    case "name_des": {
                        dataView.keywords.sort((a, b) => Controller.sortFunc(a.Name, b.Name, 1));
                        break;
                    }
                    case "name_inc": {
                        dataView.keywords.sort((a, b) => Controller.sortFunc(a.Name, b.Name, -1));
                        break;
                    }
                }
            }
            res.render('category_keywords/list', { req: req, title: 'Category Keywords', admin_name: accountAdminName, view_messages: viewMessages, data: dataView});

        }  
        catch (error) {  
            res.send("Error");   
        }  
    },
    //http get, authen admin
    CreateGet: async (req,res) => {
        try {  
            let accountAdminName = req.user.userData.name;

            let viewMessages = [];
            let viewSkill = {
                Name:"",
                IsActive: true,
            };
            res.render('category_keywords/create', { req: req, title: 'Create Skill', admin_name: accountAdminName, view_messages: viewMessages, data: viewSkill});

        }  
        catch (error) {  
            res.send("Error");   
        }  
    },
    //http post, authen admin
    CreatePost: async (req,res) => {
        try {  
            let accountAdminName = req.user.userData.name;

            let viewMessages = [];
            
            let newItem = {
                Name:req.body.name,
                IsActive: req.body.is_active ? true : false,
            };

            let nameValid = CategoryKeywordModel.isValidName(newItem.Name, req.lang);
            if (!nameValid.isValid) {
                viewMessages.push(ViewAlert.Warning(nameValid.error));
            } else {
                resAction = await CategoryKeywordModel.createCategoryKeyword(newItem,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    viewMessages.push(ViewAlert.Danger(resAction.error));  
                } else {
                    viewMessages.push(ViewAlert.Success("Create Success!"));                          
                }
            }
            res.render('category_keywords/create', { req: req, title: 'Create Category Keyword', admin_name: accountAdminName, view_messages: viewMessages, data: newItem});
        }  
        catch (error) {  
            res.send("Error");   
        }  
    },
    //http get, authen admin
    EditGet: async (req,res) => {
        try {  
            let accountAdminName = req.user.userData.name;

            let viewMessages = [];
            let viewItem = null;
            //get id
            let id = ""+req.params.id;
            resAction = await CategoryKeywordModel.getDataById(id,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                viewMessages.push(ViewAlert.Danger(resAction.error));  
            } else {
                viewItem = resAction.data;                          
            }
            res.render('category_keywords/edit', { req: req, title: 'Edit Category Keyword', admin_name: accountAdminName, view_messages: viewMessages, data: viewItem});

        }  
        catch (error) {  
            res.send("Error");   
        }  
    },
    //http post, authen admin
    EditPost: async (req,res) => {
        try {  
            let accountAdminName = req.user.userData.name;

            let viewMessages = [];
            //get id
            let id = "" + req.params.id;
            let editItem = {
                Name:req.body.name,
                IsActive: req.body.is_active ? true : false,
            };

            resAction = await CategoryKeywordModel.getDataById(id,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                viewMessages.push(ViewAlert.Danger(resAction.error));  
            } else {
                editItem = resAction.data;
                editItem.Name = req.body.name;
                editItem.IsActive = req.body.is_active ? true : false;
                editItem.ActionTime=Date.now();

                let nameValid = CategoryKeywordModel.isValidName(editItem.Name, req.lang);
                if (!nameValid.isValid) {
                    viewMessages.push(ViewAlert.Warning(nameValid.error));
                } else {
                    resAction = await CategoryKeywordModel.updateCategoryKeyword(id,editItem,req.lang);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        viewMessages.push(ViewAlert.Danger(resAction.error));  
                    } else {
                        viewMessages.push(ViewAlert.Success("Update Success!"));                          
                    }
                }           

            }

            res.render('category_keywords/edit', { req: req, title: 'Edit Category Keyword', admin_name: accountAdminName, view_messages: viewMessages, data: editItem});
        }  
        catch (error) {  
            res.send("Error");   
        }  
    },
}  

module.exports = AdminCategoryKeywordsController;