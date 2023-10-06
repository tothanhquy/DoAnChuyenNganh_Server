const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
const ViewAlert = require('../view_models/ViewAlert');
const Path = require('path');
var AccountModel = require('../models/AccountModel');  
var AccountCVModel = require('../models/AccountCVModel');  
var SkillModel = require('../models/SkillModel');  
var Controller = require('./Controller');
const AccountProfileResponse = require("../client_data_response_models/AccountProfile");
const Auth = require("../core/Auth");
const fs = require('fs');

//containt the function with business logics  
var UserProfileController = { 

    //http get
    GetMyProfile: async (req, res) => { 
        try {
            let idAccount = req.user.id;

            let clientResponse = new AccountProfileResponse.MyProfile();
            clientResponse.skills = [];
            clientResponse.cvs = [];

            let resAction = await AccountModel.getDataById(idAccount,req.lang);
            let account = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            clientResponse.info = new AccountProfileResponse.Info(
                account._id,
                account.Name,
                account.BirthYear,
                account.Maxim,
                account.Contact,
                account.CareerTarget,
                account.Education,
                account.WorkExperience,
                account.Description,
            );
            clientResponse.avatar = account.Avatar;

            
            account = await account.populate(
                {
                    path: 'Skills',
                    select: '_id Name Image IsActive'
                });
            let accountSkills = account.Skills;
            
            // console.log(accountSkills);
            if (accountSkills.length != 0) {
                // console.log(allSkills);
                accountSkills.forEach(accountSkill => {
                    if (accountSkill.IsActive === true) {
                        clientResponse.skills.push(new AccountProfileResponse.Skill(
                            accountSkill._id,
                            accountSkill.Name,
                            accountSkill.Image
                        ));
                    }
                });

                clientResponse.skills.sort((a, b) => Controller.sortFunc(a.name, b.name, -1));
            }
            
            resAction = await AccountCVModel.getCVs(req.lang,idAccount);
            let accountCVs = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            } else {
                accountCVs.forEach(element => {
                    clientResponse.cvs.push(new AccountProfileResponse.MyCV(
                        element._id,
                        element.Name,
                        element.IsActive,
                    ))
                });
            }
            // console.log(clientResponse);
            res.json(Controller.Success(clientResponse));  
        
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http get
    GetGuestProfile: async (req, res) => { 
        try {
            let idAccount = req.query.id;
            if (idAccount == undefined) {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return;
            }

            let clientResponse = new AccountProfileResponse.GuestProfile();
            clientResponse.skills = [];
            clientResponse.cvs = [];

            //get info
            let resAction = await AccountModel.getDataById(idAccount,req.lang);
            let account = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            clientResponse.info = new AccountProfileResponse.Info(
                account._id,
                account.Name,
                account.BirthYear,
                account.Maxim,
                account.Contact,
                account.CareerTarget,
                account.Education,
                account.WorkExperience,
                account.Description
            );
            clientResponse.avatar = account.Avatar;


            account = await account.populate(
                {
                    path: 'Skills',
                    select: '_id Name Image IsActive'
                });
            let accountSkills = account.Skills;
            
            // console.log(accountSkills);
            if (accountSkills.length != 0) {
                // console.log(allSkills);
                accountSkills.forEach(accountSkill => {
                    if (accountSkill.IsActive === true) {
                        clientResponse.skills.push(new AccountProfileResponse.Skill(
                            accountSkill._id,
                            accountSkill.Name,
                            accountSkill.Image
                        ));
                    }
                });

                clientResponse.skills.sort((a, b) => Controller.sortFunc(a.name, b.name, -1));
            }
            
            //get cvs
            resAction = await AccountCVModel.getCVs(req.lang,idAccount);
            let accountCVs = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            } else {
                accountCVs.forEach(element => {
                    clientResponse.cvs.push(new AccountProfileResponse.GuestCV(
                        element._id,
                        element.Name,
                    ))
                });
            }
            //set relationship
            let ownAccount = await Auth.CheckAndGetAuthenUser(req);
            if (ownAccount === false) {
                //guest
                clientResponse.relationship = AccountProfileResponse.Relationship.Guest;
            } else if (idAccount == ownAccount.id) {
                //owner
                clientResponse.relationship = AccountProfileResponse.Relationship.Owner;
            } else {
                //user login
                clientResponse.relationship = AccountProfileResponse.Relationship.UserLogin;
                //friend

                if(account.Friends.indexOf(ownAccount.id)!=-1){
                    clientResponse.relationship += "|" + AccountProfileResponse.Relationship.Friend;
                }
                
                //leader
                clientResponse.relationship += "|" + AccountProfileResponse.Relationship.Leader;

                

            }

            res.json(Controller.Success(clientResponse));  
        
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http post
    EditInfo: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let resAction = await AccountModel.getDataById(idAccount,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            } else {
                let editAccount = resAction.data;
                console.log(req.body)
                editAccount.Name = req.body.name;
                let nameValid = AccountModel.isValidName(editAccount.Name, req.lang);
                if (!nameValid.isValid) {
                    res.json(Controller.Fail(nameValid.error));
                    return;
                }

                editAccount.BirthYear = req.body.birth_year;
                let birthYearValid = AccountModel.isValidBirthYear(editAccount.BirthYear, req.lang);
                if (!birthYearValid.isValid) {
                    res.json(Controller.Fail(birthYearValid.error));
                    return;
                }

                editAccount.Maxim = req.body.maxim;
                let maximValid = AccountModel.isValidMaxim(editAccount.Maxim, req.lang);
                if (!maximValid.isValid) {
                    res.json(Controller.Fail(maximValid.error));
                    return;
                }
                editAccount.Description = req.body.description;
                let descriptionValid = AccountModel.isValidDescription(editAccount.Description, req.lang);
                if (!descriptionValid.isValid) {
                    res.json(Controller.Fail(descriptionValid.error));
                    return;
                }
                editAccount.Contact = req.body.contact;
                let contactValid = AccountModel.isValidContact(editAccount.Contact, req.lang);
                if (!contactValid.isValid) {
                    res.json(Controller.Fail(contactValid.error));
                    return;
                }
                editAccount.CareerTarget = req.body.career_target;
                let careerTargetValid = AccountModel.isValidDescription(editAccount.CareerTarget, req.lang);
                if (!careerTargetValid.isValid) {
                    res.json(Controller.Fail(careerTargetValid.error));
                    return;
                }
                editAccount.Education = req.body.education;
                let educationValid = AccountModel.isValidDescription(editAccount.Education, req.lang);
                if (!educationValid.isValid) {
                    res.json(Controller.Fail(educationValid.error));
                    return;
                }
                editAccount.WorkExperience = req.body.work_experience;
                let workExperienceValid = AccountModel.isValidDescription(editAccount.WorkExperience, req.lang);
                if (!workExperienceValid.isValid) {
                    res.json(Controller.Fail(workExperienceValid.error));
                    return;
                }

                //update
                resAction = await AccountModel.updateAccount(idAccount, editAccount,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));   
                    return;
                } else {
                    res.json(Controller.Success({ isComplete: true }));  
                    return;
                }
          
            }
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },
    //http post
    // EditSkills: async (req,res) => {
    //     try {
    //         let idAccount = req.user.id;
    //         let accountSkills = JSON.parse(req.body.skills)||[];
            
    //         if (!Controller.isStringArray(accountSkills)) {
    //             res.json(Controller.Fail(Message(req.lang, "system_error")));
    //             return; 
    //         }

    //         //delete old skills
    //         let resAction = await AccountSkillModel.deleteSkills(req.lang,idAccount);
    //         if (resAction.status == ModelResponse.ResStatus.Fail) {
    //             res.json(Controller.Fail(Message(req.lang, "system_error")));
    //             return; 
    //         } else {
    //             resAction = await SkillModel.getAllSkillsByUser(req.lang);
    //             let allSkills = resAction.data;
    //             if (resAction.status == ModelResponse.ResStatus.Fail) {
    //                 res.json(Controller.Fail(resAction.error));
    //                 return;
    //             }
    //             let newIdSkills = [];

    //             // console.log(accountSkills);
    //             // console.log(allSkills);
    //             accountSkills.forEach(ele => {
    //                 let skill = allSkills.find(a => a._id == ele);
    //                 if (skill !== undefined&&skill.IsActive===true) {
    //                     newIdSkills.push(ele);
    //                 }
    //             });

    //             if (newIdSkills.length == 0) {
    //                 //empty new skills
    //                 res.json(Controller.Success({ isComplete: true }));  
    //                 return;
    //             }
    //             // console.log(newIdSkills);
    //             //insert
    //             resAction = await AccountSkillModel.insertSkills(req.lang,idAccount, newIdSkills);
    //             if (resAction.status == ModelResponse.ResStatus.Fail) {
    //                 res.json(Controller.Fail(resAction.error));   
    //                 return;
    //             } else {
    //                 res.json(Controller.Success({ isComplete: true }));  
    //                 return;
    //             }
          
    //         }
    //     }  
    //     catch (error) {  
    //         console.log(error);
    //         res.json(Controller.Fail(Message(req.lang, "system_error")));
    //     }  
    // },
    //http post
    EditSkills: async (req,res) => {
        try {
            let idAccount = req.user.id;
            let accountSkills = JSON.parse(req.body.skills)||[];
            
            if (!Controller.isStringArray(accountSkills)) {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await AccountModel.getDataById(idAccount,req.lang);
            let editAccount = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            resAction = await SkillModel.getAllSkillsByUser(req.lang);
            let allSkills = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let newIdSkills = [];

            accountSkills.forEach(ele => {
                let skill = allSkills.find(a => a._id == ele);
                if (skill !== undefined&&skill.IsActive===true) {
                    newIdSkills.push(ele);
                }
            });

            editAccount.Skills = newIdSkills;

            //update
            resAction = await AccountModel.updateAccount(idAccount, editAccount,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                res.json(Controller.Success({ isComplete: true }));  
                return;
            }
          
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },
    //http post
    InsertCV: async (req,res) => {
        try {  
            let idAccount = req.user.id;

            let insertCV = new AccountCVModel();
            insertCV.Name = req.body.name;
            insertCV.IsActive = req.body.is_active ? true : false;
            insertCV.AccountId = idAccount;

            let nameValid = AccountCVModel.isValidName(req.lang,insertCV.Name);
            if (!nameValid.isValid) {
                res.json(Controller.Fail(nameValid.error));
                return; 
            } else {
                //must upload pdf
                if (!req.files || !req.files.cv_pdf) {
                    res.json(Controller.Fail(Message(req.lang,'must_upload_file_pdf')));
                    return; 
                } else if (req.files.cv_pdf.size > Controller.Constant.CV_PDF_FILE_LIMIT_KB*1024) {
                    res.json(Controller.Fail(Message(req.lang,'pdf_file_limit_size_kb').replace('{{size}}',Controller.Constant.CV_PDF_FILE_LIMIT_KB )));
                    return; 
                } else {
                    let cvPDFFile = req.files.cv_pdf;
                    let fullPath = Path.join(__dirname,'..','private_resources','UserProfileCVs');
                    if (!cvPDFFile.mimetype=="application/pdf") {
                        res.json(Controller.Fail(Message(req.lang,'file_only_pdf')));
                        return; 
                    } else {
                        let cvPDFFilePath = idAccount +"."+Date.now() +"."+ cvPDFFile.name;
                        cvPDFFile.mv(Path.join(fullPath, cvPDFFilePath));
                        insertCV.FilePath = cvPDFFilePath;

                        resAction = await AccountCVModel.createCV(req.lang,insertCV);
                        if (resAction.status == ModelResponse.ResStatus.Fail) {
                            res.json(Controller.Fail(resAction.error));
                            return; 
                        } else {
                            res.json(Controller.Success({ isComplete: true }));  
                            return;                          
                        }
                    }
                }
                
            }  
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error"))); 
        }  
    },
    //http post
    EditCV: async (req,res) => {
        try {  
            let idAccount = req.user.id;

            //get id
            let idCV = req.body.id;

            let resAction = await AccountCVModel.getCVById(req.lang,idCV);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return; 
            } else {
                let editCV = resAction.data;
                editCV.Name = req.body.name;
                if (req.body.is_active && req.body.is_active == "true") {
                    editCV.IsActive = true;
                } else {
                    editCV.IsActive = false;
                }
                

                if (editCV.AccountId != idAccount) {
                    //account is not owner
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }

                let nameValid = AccountCVModel.isValidName(req.lang,editCV.Name);
                if (!nameValid.isValid) {
                    res.json(Controller.Fail(nameValid.error));
                    return; 
                } else {
                    //upload pdf
                    if (req.files && req.files.cv_pdf) {
                        let cvPDFFile = req.files.cv_pdf;
                        let fullPath = Path.join(__dirname,'..','private_resources','UserProfileCVs');
                        if (!cvPDFFile.mimetype=="application/pdf") {
                            res.json(Controller.Fail(Message(req.lang,'file_only_pdf')));
                            return; 
                        } else if (req.files.cv_pdf.size > Controller.Constant.CV_PDF_FILE_LIMIT_KB*1024) {
                            res.json(Controller.Fail(Message(req.lang,'pdf_file_limit_size_kb').replace('{{size}}',Controller.Constant.CV_PDF_FILE_LIMIT_KB )));
                            return; 
                        } else {
                            //delete old
                            if (editCV.FilePath!=null&&editCV.FilePath!=""&&Controller.isExistPath(Path.join(fullPath, editCV.FilePath))) {
                                if (!Controller.deleteFile(Path.join(fullPath, editCV.FilePath))) {
                                    res.json(Controller.Fail(Message(req.lang,'error_with_save_file')));
                                    return; 
                                }
                            }
                            let cvPDFFilePath = idAccount +"."+Date.now() +"."+ cvPDFFile.name;
                            cvPDFFile.mv(Path.join(fullPath, cvPDFFilePath));
                            editCV.FilePath = cvPDFFilePath;
                        }
                    }
                    resAction = await AccountCVModel.updateCV(req.lang,idCV,editCV);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(resAction.error));
                        return; 
                    } else {
                        res.json(Controller.Success({ isComplete: true }));  
                        return;                          
                    }
                }           

            }

        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error"))); 
        }  
    },

    //http post
    EditAvatar: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let resAction = await AccountModel.getDataById(idAccount,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            } else {
                let editAccount = resAction.data;
                console.log(req.files.avatar.size)
                console.log(req.files.avatar.name)
                //must upload image
                if (!req.files || !req.files.avatar) {
                    res.json(Controller.Fail(Message(req.lang,'must_upload_file_image')));
                    return; 
                } else if (req.files.avatar.size > Controller.Constant.USER_AVATAR_FILE_LIMIT_KB*1024) {
                    res.json(Controller.Fail(Message(req.lang,'image_file_limit_size_kb').replace('{{size}}',Controller.Constant.USER_AVATAR_FILE_LIMIT_KB )));
                    return; 
                } else {
                    let image = req.files.avatar;
                    console.log(image.mimetype)
                    let fullPath = Path.join(__dirname,'..','public','images','users_avatar');
                    if (!image.mimetype.startsWith('image/')) {
                        res.json(Controller.Fail(Message(req.lang,'file_only_image')));
                        return; 
                    } else {
                        //delete old
                        if (editAccount.Avatar!=null&&editAccount.Avatar!=""&&Controller.isExistPath(Path.join(fullPath, editAccount.Avatar))) {
                            if (!Controller.deleteFile(Path.join(fullPath, editAccount.Avatar))) {
                                res.json(Controller.Fail(Message(req.lang,'error_with_save_file')));
                                return; 
                            }
                        }
                        
                        let avatarPath = idAccount +"."+ image.name;
                        image.mv(Path.join(fullPath, avatarPath));
                        editAccount.Avatar = avatarPath;

                        //update
                        resAction = await AccountModel.updateAccount(idAccount, editAccount,req.lang);
                        if (resAction.status == ModelResponse.ResStatus.Fail) {
                            res.json(Controller.Fail(resAction.error));   
                            return;
                        } else {
                            res.json(Controller.Success({ new_avatar: avatarPath }));  
                            return;
                        }
                    }
                }

                
          
            }
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },

    //http post
    DeleteCV: async (req,res) => {
        try {  
            let idAccount = req.user.id;

            //get id
            let idCV = req.body.id;

            let resAction = await AccountCVModel.getCVById(req.lang,idCV);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return; 
            } else {
                let deleteCV = resAction.data;
                if (deleteCV.AccountId != idAccount) {
                    //account is not owner
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }

                //delete old
                let fullPath = Path.join(__dirname,'..','private_resources','UserProfileCVs');
                if (deleteCV.FilePath!=null&&deleteCV.FilePath!=""&&Controller.isExistPath(Path.join(fullPath, deleteCV.FilePath))) {
                    if (!Controller.deleteFile(Path.join(fullPath, deleteCV.FilePath))) {
                        res.json(Controller.Fail(Message(req.lang,'system_error')));
                        return; 
                    }
                }

                resAction = await AccountCVModel.deleteCV(req.lang,idCV);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return; 
                } else {
                    res.json(Controller.Success({ isComplete: true }));  
                    return;                          
                }

            }

        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error"))); 
        }  
    },

    //http get
    ViewPDFCV: async (req, res) => { 
        try {
            let idCV = req.query.idcv;
            let token = req.query.token;
            if (idCV == undefined) {
                res.send(Message(req.lang, "cv_not_exist"));
                return;
            }

            let resAction = await AccountCVModel.getCVById(req.lang,idCV);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.send(resAction.error);
                return;
            } else {
                let cv = resAction.data;
                if (
                    cv.IsActive == true ||
                    (
                        token !== undefined &&token !== "" && token == cv.OwnerToken
                        && (
                            parseInt(token.split('.')[1]) >= Date.now()
                        )
                    )
                ) {
                    //show
                    let fullPath = Path.join(__dirname,'..','private_resources','UserProfileCVs',cv.FilePath);
                    if (cv.FilePath != null && cv.FilePath != "" && Controller.isExistPath(fullPath)) {
                        var file = fs.createReadStream(fullPath);
                        var stat = fs.statSync(fullPath);
                        // res.setHeader('Content-Length', stat.size);
                        res.setHeader('Content-Type', 'application/pdf');
                        // res.setHeader('Content-Disposition', 'inline; filename='+cv.FilePath);
                        // file.pipe(res);
                        res.sendFile(fullPath);
                    }
                } else {
                    res.send(Message(req.lang, "permissions_denied_action"))
                    return;
                }
            }
        
        }  
        catch (error) {  
            console.log(error);
            res.send(Message(req.lang,"system_error"));   
        }  
    },

    //http post
    OwnerRequestViewPDFCV: async (req,res) => {
        try {  
            let idAccount = req.user.id;

            //get id
            let idCV = req.body.id;

            let resAction = await AccountCVModel.getCVById(req.lang,idCV);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return; 
            } else {
                let editCV = resAction.data;
                
                if (editCV.AccountId != idAccount) {
                    //account is not owner
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }
                let token = Controller.generateRandomString(20) + "." + (Date.now() + AccountCVModel.OWNER_TOKEN_TIME);
                editCV.OwnerToken = token;

                resAction = await AccountCVModel.updateCV(req.lang,idCV,editCV);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return; 
                } else {
                    res.json(Controller.Success({ owner_token: token }));  
                    return;                          
                }
                         

            }

        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error"))); 
        }  
    },
}  

module.exports = UserProfileController;