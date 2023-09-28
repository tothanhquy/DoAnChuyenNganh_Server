const Message = require('../../messages/Messages');
const ModelResponse = require('../../models/ModelResponse');
const ViewAlert = require('../../view_models/ViewAlert');
const Path = require('path');
var AccountModel = require('../../models/AccountModel');  
var SkillModel = require('../../models/SkillModel');  
var Controller = require('../Controller');


//containt the function with business logics  
var AdminSkillsController = { 

    //http get
    SkillList: async (req,res) => {
        try {
            // if ((await Controller.isAuthorizeAdmin(req)) == false) {
            //     res.redirect("../../Account/Login");
            // }
            // let accessToken = Controller.getAccessToken(req);
            // let resAction = await AccountModel.getDataById(accessToken.id, req.lang);
            // let accountAdmin = resAction.data;
            // if (resAction.status == ModelResponse.ResStatus.Fail) {
            //     res.send("Error");
            // }
            let accountAdminName = req.user.userData.name;

            let viewMessages = [];
            let dataView = { skills: [], filter: {} };
            if (req.query.sort_type === undefined) {
                dataView.filter.sortType = "date_des";
            } else {
                dataView.filter.sortType = req.query.sort_type;
            }

            resAction = await SkillModel.getAllSkills(req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                viewMessages.push(ViewAlert.Danger("Can not load list of skills."));  
            } else {
                dataView.skills = resAction.data;
                //sort
                switch (dataView.filter.sortType) {
                    case "date_des": {
                        dataView.skills.sort((a, b) => Controller.sortFunc(a.CreatedTime, b.CreatedTime, 1));
                        break;
                    }
                    case "date_inc": {
                        dataView.skills.sort((a, b) => Controller.sortFunc(a.CreatedTime, b.CreatedTime, -1));
                        break;
                    }
                    case "name_des": {
                        dataView.skills.sort((a, b) => Controller.sortFunc(a.Name, b.Name, 1));
                        break;
                    }
                    case "name_inc": {
                        dataView.skills.sort((a, b) => Controller.sortFunc(a.Name, b.Name, -1));
                        break;
                    }
                }
            }
            res.render('skills/list', { req: req, title: 'Skills', admin_name: accountAdminName, view_messages: viewMessages, data: dataView});

        }  
        catch (error) {  
            res.send("Error");   
        }  
    },
    //http get
    CreateGet: async (req,res) => {
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
            let viewSkill = new SkillModel({
                Name:"",
                IsActive: true,
                Image:""
            });
            res.render('skills/create', { req: req, title: 'Create Skill', admin_name: accountAdminName, view_messages: viewMessages, data: viewSkill});

        }  
        catch (error) {  
            res.send("Error");   
        }  
    },
    //http post
    CreatePost: async (req,res) => {
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
            //upload image
            let imageName = "";
            if (req.files && req.files.image_skill) {
                let image = req.files.image_skill;
                let fullPath = Path.join(__dirname,'..','..','public','images','skills');
                if (!image.mimetype.startsWith('image/')) {
                    viewMessages.push(ViewAlert.Warning(Message(req.lang,'file_only_image')));
                } else {
                    imageName = Date.now() +"."+ image.name;
                    image.mv(Path.join(fullPath, imageName));
                }
            }
            let newSkill = new SkillModel({
                Name:req.body.name,
                IsActive: req.body.is_active ? true : false,
                Image:imageName
            });

            let nameValid = SkillModel.isValidName(newSkill.Name, req.lang);
            if (!nameValid.isValid) {
                viewMessages.push(ViewAlert.Warning(nameValid.error));
            } else {
                resAction = await SkillModel.createSkill(newSkill,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    viewMessages.push(ViewAlert.Danger(resAction.error));  
                } else {
                    viewMessages.push(ViewAlert.Success("Create Success!"));                          
                }
            }
            res.render('skills/create', { req: req, title: 'Create Skill', admin_name: accountAdminName, view_messages: viewMessages, data: newSkill});
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
            let viewSkill = null;
            //get id
            let id = ""+req.params.id;
            resAction = await SkillModel.getDataById(id,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                viewMessages.push(ViewAlert.Danger(resAction.error));  
            } else {
                viewSkill = resAction.data;                          
            }
            res.render('skills/edit', { req: req, title: 'Edit Skill', admin_name: accountAdminName, view_messages: viewMessages, data: viewSkill});

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
            let editSkill = new SkillModel({
                Name:req.body.name,
                IsActive: req.body.is_active ? true : false,
                Image:""
            });

            resAction = await SkillModel.getDataById(id,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                viewMessages.push(ViewAlert.Danger(resAction.error));  
            } else {
                editSkill = resAction.data;
                editSkill.Name = req.body.name;
                editSkill.IsActive = req.body.is_active ? true : false;

                let nameValid = SkillModel.isValidName(editSkill.Name, req.lang);
                if (!nameValid.isValid) {
                    viewMessages.push(ViewAlert.Warning(nameValid.error));
                } else {
                    //upload image
                    let imageName = "";
                    if (req.files && req.files.image_skill) {
                        let image = req.files.image_skill;
                        let fullPath = Path.join(__dirname,'..','..','public','images','skills');
                        if (!image.mimetype.startsWith('image/')) {
                            viewMessages.push(ViewAlert.Warning(Message(req.lang,'file_only_image')));
                        } else {
                            //delete old
                            if (editSkill.Image!=null&&editSkill.Image!=""&&Controller.isExistPath(Path.join(fullPath, editSkill.Image))) {
                                if (!Controller.deleteFile(Path.join(fullPath, editSkill.Image))) {
                                    viewMessages.push(ViewAlert.Warning(Message(req.lang,'error_with_save_file')));
                                }
                            }
                            imageName = Date.now() +"."+ image.name;
                            image.mv(Path.join(fullPath, imageName));
                            editSkill.Image = imageName;
                        }
                    }
                    resAction = await SkillModel.updateSkill(id,editSkill,req.lang);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        viewMessages.push(ViewAlert.Danger(resAction.error));  
                    } else {
                        viewMessages.push(ViewAlert.Success("Update Success!"));                          
                    }
                }           

            }

            res.render('skills/edit', { req: req, title: 'Edit Skill', admin_name: accountAdminName, view_messages: viewMessages, data: editSkill});
        }  
        catch (error) {  
            res.send("Error");   
        }  
    },
}  

module.exports = AdminSkillsController;