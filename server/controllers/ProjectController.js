const ViewAlert = require('../view_models/ViewAlert');
const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var ProjectModel = require('../models/ProjectModel');  
var CategoryKeywordModel = require('../models/CategoryKeywordModel');  
var AccountModel = require('../models/AccountModel');
var Auth = require('../core/Auth');  
const Mail = require('../core/Mail');
var Controller = require('./Controller');
const ProjectResponse = require("../client_data_response_models/Project");
const Path = require('path');

//containt the function with business logics  
var ProjectController = {  
    //http post, authen
    Create : async function(req,res){  
        try {  
            let idAccount = req.user.id;
            let name = req.body.name;

            //valid
            let nameValid = ProjectModel.isValidName(name, req.lang);
            if (!nameValid.isValid) {
                res.json(Controller.Fail(nameValid.error));
                return;
            }
            let resAction = await AccountModel.getDataById(idAccount,req.lang);
            let accountOwner = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            let idAccountObject = accountOwner._id;

            let newItem = new ProjectModel();
            newItem.Name = name;
            newItem.Leader = idAccountObject;
            newItem.CreatedTime = Date.now();

            let member = new ProjectModel.ProjectMemberNow();
            member.User = idAccountObject;
            member.Role = "Leader";

            newItem.Members = [member];

            let memberHistory = new ProjectModel.ProjectMemberHistory();
            memberHistory.User = idAccountObject;
            memberHistory.Role = "Leader";
            memberHistory.Time = Date.now();
            memberHistory.IsOut = false;

            newItem.MembersHistory = [memberHistory];

            resAction = await ProjectModel.createProject(newItem,req.lang); 
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            } else {
                let newItemId = resAction.data.id;

                resAction = await ProjectModel.getDataByIdPopulateBasic(newItemId,req.lang); 
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return;
                } else{
                    let queryProject = resAction.data;

                    let newProjectRes = new ProjectResponse.ProjectListItem(
                        queryProject._id,
                        queryProject.Name,
                        queryProject.Avatar,
                        queryProject.Leader._id,
                        queryProject.Leader.Name,
                        queryProject.Leader.Avatar,
                        queryProject.Members.length,
                        queryProject.Leader._id.toString()==idAccount
                    )
                    //
                    res.json(Controller.Success({ newItem: newProjectRes }));
                    return;
                }
            }
            
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http post, authen
    EditAvatar: async (req,res) => {
        try {
            let idAccount = req.user.id;
            let idProject = req.body.id;

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await ProjectModel.getDataById(idProject,req.lang);
            let editProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            if (editProject.Leader.toString() != idAccount) {
                //not leader
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return; 
            }

            //must upload image
            if (!req.files || !req.files.avatar) {
                res.json(Controller.Fail(Message(req.lang,'must_upload_file_image')));
                return; 
            } else if (req.files.avatar.size > Controller.Constant.PROJECT_AVATAR_FILE_LIMIT_KB*1024) {
                res.json(Controller.Fail(Message(req.lang,'image_file_limit_size_kb').replace('{{size}}',Controller.Constant.PROJECT_AVATAR_FILE_LIMIT_KB )));
                return; 
            } else {
                let image = req.files.avatar;
                console.log(image.mimetype)
                let fullPath = Path.join(__dirname,'..','public','images','projects_avatar');
                if (!image.mimetype.startsWith('image/')) {
                    res.json(Controller.Fail(Message(req.lang,'file_only_image')));
                    return; 
                } else {
                    //delete old
                    if (editProject.Avatar!=null&&editProject.Avatar!=""&&Controller.isExistPath(Path.join(fullPath, editProject.Avatar))) {
                        if (!Controller.deleteFile(Path.join(fullPath, editProject.Avatar))) {
                            res.json(Controller.Fail(Message(req.lang,'error_with_save_file')));
                            return; 
                        }
                    }
                    
                    let avatarPath = idProject +"."+ image.name;
                    image.mv(Path.join(fullPath, avatarPath));
                    editProject.Avatar = avatarPath;

                    //update
                    let updateFields = {$set:{Avatar:editProject.Avatar}};
                
                    resAction = await ProjectModel.updateProject(idProject, updateFields,req.lang);
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
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },
    //http get, authen
    GetMyProjects: async (req, res) => { 
        try {
            let idAccount = req.user.id;

            let projects = [];

            let resAction = await ProjectModel.getProjectsOfUser(idAccount,req.lang);
            let queryProjects = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            queryProjects.sort((a, b) => Controller.sortFunc(a.Name, b.Name, -1));

            queryProjects.forEach(element => {
                projects.push(
                    new ProjectResponse.ProjectListItem(
                        element._id,
                        element.Name,
                        element.Avatar,
                        element.Leader._id,
                        element.Leader.Name,
                        element.Leader.Avatar,
                        element.Members.length,
                        element.Leader._id.toString()==idAccount
                    )
                );
            });
            
            res.json(Controller.Success({ projects: projects }));  
        
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },


    //http get
    Details: async (req, res) => { 
        try {
            let idProject = req.query.id;

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let project = new  ProjectResponse.ProjectDetails();

            let resAction = await ProjectModel.getDataByIdPopulateBasic(idProject,req.lang);
            let queryProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            project.projectId = queryProject._id;
            project.projectName = queryProject.Name;
            project.projectAvatar = queryProject.Avatar;
            project.leaderId = queryProject.Leader._id;
            project.leaderName = queryProject.Leader.Name;
            project.leaderAvatar = queryProject.Leader.Avatar;
            project.slogon = queryProject.Slogon;
            project.description = queryProject.Description;
            
            //get member
            let members = [];
            queryProject.Members.forEach(member => {
                members.push(
                    new ProjectResponse.MemberNow(
                        member.User._id,
                        member.User.Name,
                        member.User.Avatar,
                        member.Role,
                        member._id.toString()==project.leaderId
                    )
                );
            });
            project.members = members;

            //get category keyword
            let categoryKeywords = [];
            queryProject.CategoryKeyWords.forEach(cate => {
                if(cate.IsActive)
                categoryKeywords.push(
                    new ProjectResponse.CategoryKeyword(
                        cate._id,
                        cate.Name
                    )
                );
            });
            project.categoryKeywords = categoryKeywords;

            //set relationship and internal info
            let account = await Auth.CheckAndGetAuthenUser(req);
            if (account === false) {
                //guest
                project.relationship = ProjectResponse.Relationship.Guest;
            } else {
                project.relationship=ProjectResponse.Relationship.UserLogin;
                
                if (project.leaderId == account.id.toString()) {
                    project.relationship+='.'+ProjectResponse.Relationship.Leader;
                }

                let checkMemberIndex = project.members.findIndex(a => a.id == account.id.toString());

                if (checkMemberIndex !== -1) {
                    project.relationship+='.'+ProjectResponse.Relationship.Member;
                }
            }

            project.tags=queryProject.Tags;
            project.followsNumber=queryProject.UserFollows.length;
            project.imagesNumber=queryProject.Images.length;
            project.videosNumber=queryProject.Videos.length;
            project.resportsNumber=queryProject.NegativeReports.length;

            let totalStars=0;
            project.isFollow=false;
            queryProject.VoteStars.forEach(e=>{
                totalStars+=e.Star;
                if(project.relationship==ProjectResponse.Relationship.UserLogin&&
                    e.User.toString()==account.id.toString()){
                        project.isFollow=true;
                    }
            });
            project.voteStar=Math.round((totalStars/queryProject.VoteStars.length) * 10) / 10;

            res.json(Controller.Success(project));  
        
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    
    //http post, authen
    EditBasicInfo: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idProject = req.body.id;

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await ProjectModel.getDataById(idProject,req.lang);
            let editProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            if (editProject.Leader.toString() != idAccount) {
                //not leader
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return; 
            }
            
            editProject.Name = req.body.name;
            let nameValid = ProjectModel.isValidName(editProject.Name, req.lang);
            if (!nameValid.isValid) {
                res.json(Controller.Fail(nameValid.error));
                return;
            }

            editProject.Slogon = req.body.slogon;
            let slogonValid = ProjectModel.isValidSlogon(editProject.Slogon, req.lang);
            if (!slogonValid.isValid) {
                res.json(Controller.Fail(slogonValid.error));
                return;
            }

            editProject.Description = req.body.description;
            let descriptionValid = ProjectModel.isValidDescription(editProject.Description, req.lang);
            if (!descriptionValid.isValid) {
                res.json(Controller.Fail(descriptionValid.error));
                return;
            }

            //update
            let updateFields = {$set:{
                Name:editProject.Name,
                Slogon:editProject.Slogon,
                Description:editProject.Description,
            }};

            resAction = await ProjectModel.updateProject(idProject, updateFields,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                res.json(Controller.Success({ isComplete:true }));  
                return;
            }
            
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },
    //http get, authen
    GetEditBasicInfo: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idProject = req.body.id;

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await ProjectModel.getDataById(idProject,req.lang);
            let queryProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            if (editProject.Leader.toString() != idAccount) {
                //not leader
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return; 
            }
            
            let editBasicInfo = new ProjectResponse.EditBasicInfo();
            editBasicInfo.name = queryProject.Name;
            editBasicInfo.slogon = queryProject.Slogon;
            editBasicInfo.description = queryProject.Description;

            res.json(Controller.Success({ editBasicInfo:editBasicInfo }));  
            return;
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },

    //http post, authen
    EditTags: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idProject = req.body.id;
            let tags = JSON.parse(req.body.tags)||[];

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            if (!Controller.isStringArray(tags)) {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            tags.forEach(e=>{
                let tagValid = ProjectModel.isValidTag(e, req.lang);
                if (!tagValid.isValid) {
                    res.json(Controller.Fail(tagValid.error));
                    return;
                }
            });

            let tagNumberValid = ProjectModel.isValidTagNumber(tags.length, req.lang);
            if (!tagNumberValid.isValid) {
                res.json(Controller.Fail(tagNumberValid.error));
                return;
            }

            let resAction = await ProjectModel.getDataById(idProject,req.lang);
            let editProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            if (editProject.Leader.toString() != idAccount) {
                //not leader
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return; 
            }
            
            editProject.Tags = tags;
            
            //update
            let updateFields = {$set:{
                Tags:editProject.Tags
            }};

            resAction = await ProjectModel.updateProject(idProject, updateFields,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                res.json(Controller.Success({ isComplete:true }));  
                return;
            }
            
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },

    //http post, authen
    ToogleFollow: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idProject = req.body.id;

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await ProjectModel.getDataById(idProject,req.lang);
            let editProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            
            let indexFollow = editProject.UserFollows.findIndex(e=>e.toString()==idAccount);
            if(indexFollow!=-1){
                //unfollow
                editProject.UserFollows.splice(indexFollow,1);
            }else{
                editProject.UserFollows.push(idAccount);
            }
            //update
            let updateFields = {$set:{
                UserFollows:editProject.UserFollows
            }};

            resAction = await ProjectModel.updateProject(idProject, updateFields,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                res.json(Controller.Success({ isComplete:true }));  
                return;
            }
            
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },

    //http post, authen
    VoteStar: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idProject = req.body.id;
            let star = parseInt(req.body.star);

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }
            if (isNaN(star)){
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }
            let starValid = ProjectModel.isValidVoteStar(star, req.lang);
            if (!starValid.isValid) {
                res.json(Controller.Fail(starValid.error));
                return;
            }

            let resAction = await ProjectModel.getDataById(idProject,req.lang);
            let editProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            
            let indexVote = editProject.VoteStars.findIndex(e=>e.User.toString()==idAccount);
            if(indexVote!=-1){
                //unfollow
                editProject.VoteStars[indexVote].Star = star;
            }else{
                let newVote = new ProjectModel.ProjectVoteStar();
                newVote.User = idAccount;
                newVote.Star = star;

                editProject.VoteStars.push(newVote);
            }
            //update
            let updateFields = {$set:{
                VoteStars:editProject.VoteStars
            }};

            resAction = await ProjectModel.updateProject(idProject, updateFields,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                res.json(Controller.Success({ isComplete:true }));  
                return;
            }
            
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },
    //http get, authen
    GetMyVoteStar: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idProject = req.body.id;

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await ProjectModel.getDataById(idProject,req.lang);
            let editProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            
            let myVoteStar = 0;
            for(let i = 0;i<editProject.VoteStars.length;i++){
                if(editProject.VoteStars[i].User.toString()==idAccount){
                    myVoteStar=editProject.VoteStars[i].Star;
                    break;
                }
            }
            
            res.json(Controller.Success({ myVoteStar:myVoteStar }));  
            return;
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },

    //not http, this is tool, return boolean of result
    updateMember:async function(language,idProject,idUser,role="",isOut=false){
        try{
            let resAction = await ProjectModel.getDataById(idProject,language);
            let editProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                return Controller.Fail(resAction.error);
            }
            let roleValid = ProjectModel.isValidMemberRole(role, language);
            if (!roleValid.isValid) {
                return Controller.Fail(roleValid.error);
            }
            if(isOut==true){
                //out project
                let indexMember = editProject.Members.findIndex(e=>e.User.toString()==idUser);
                if(indexMember==-1){
                    //not a member
                    return Controller.Success({ isComplete:true });
                }
                //remove member now
                editProject.Members.splice(indexMember,1);

            }else{
                //change
                let indexMember = editProject.Members.findIndex(e=>e.User.toString()==idUser);
                if(indexMember==-1){
                    //add member now
                    let newMemberNow = new ProjectModel.ProjectMemberNow();
                    newMemberNow.User = idUser;
                    newMemberNow.Role=role;
                    editProject.Members.push(newMemberNow);
                }
            }
            let newMemberHistory = new ProjectModel.ProjectMemberHistory();
            newMemberHistory.User = idUser;
            newMemberHistory.IsOut=false;
            newMemberHistory.Time=Data.now();
            newMemberHistory.Role=role;
            editProject.MembersHistory.push(newMemberHistory);

            //update
            let updateFields = {$set:{
                MembersHistory:editProject.MembersHistory,
                Members:editProject.Members
            }};

            resAction = await ProjectModel.updateProject(idProject, updateFields,language);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                return Controller.Fail(resAction.error);
            } else {
                return Controller.Success({ isComplete:true });
            }
        }catch(err){
            console.log(err);
            return Controller.Fail(Message(language, "system_error"));
        }
    },
    //http post, authen
    ExitProject: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idProject = req.body.id_project;
            let idNewLeader = req.body.id_new_leader;

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await ProjectModel.getDataById(idProject,req.lang);
            let editProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            if (editProject.Leader.toString() != idAccount) {
                //not leader
            } else {
                //is leader
                let memberExistIndex = editProject.Members.findIndex(e=>e.toString()==idNewLeader);

                if (idAccount == idNewLeader||memberExistIndex==-1) {
                    res.json(Controller.Fail(Message(req.lang, 'new_leader_unvalid')));
                    return; 
                }

                //update new leader
                editProject.Leader = idNewLeader;
            }
            //delate member
            let resUpdateMember = await updateMember(req.lang,idProject,idAccount,"",true);
            if(resUpdateMember.status==Controller.ResStatus.Fail){
                res.json(Controller.Fail(resUpdateMember.error));
            }
            
            //update
            let updateFields = {$set:{
                Leader:editProject.Leader
            }};

            resAction = await ProjectModel.updateProject(idProject, updateFields,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                res.json(Controller.Success({ isComplete:true }));  
                return;
            }
            
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },
    //http get
    GetMembersNow: async (req, res) => { 
        try {
            let idProject = req.query.id;

            let resAction = await ProjectModel.getDataByIdPopulateBasic(idProject,req.lang);
            let queryProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            
            let resObject = new ProjectResponse.MembersList();
            resObject.isLeader=false;
            //get members
            let members = [];

            queryProject.Members.forEach(member => {
                members.push(
                    new ProjectResponse.Member(
                        member.User._id,
                        member.User.Name,
                        member.User.Avatar,
                        member.Role,
                        member._id.toString()==queryProject.Leader.toString()
                    )
                );
            });
            resObject.members = members;

            //set relationship
            let account = await Auth.CheckAndGetAuthenUser(req);
            if (account === false) {
                //guest
            } else {
                if (queryProject.Leader.toString() == account.id) {
                    resObject.isLeader = true;
                }
            }
            res.json(Controller.Success(resObject));  
        
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http get
    GetMembersHistory: async (req, res) => { 
        try {
            let idProject = req.query.id;

            let resAction = await ProjectModel.getDataByIdPopulateBasic(idProject,req.lang);
            let queryProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            
            let resObject = new ProjectResponse.MembersList();
            resObject.isLeader=false;
            //get members
            let members = [];

            queryProject.MembersHistory.forEach(member => {
                members.push(
                    new ProjectResponse.MemberHistory(
                        member.User._id,
                        member.User.Name,
                        member.User.Avatar,
                        member.Role,
                        member.Time,
                        member.IsOut
                    )
                );
            });
            resObject.members = members;

            //set relationship
            let account = await Auth.CheckAndGetAuthenUser(req);
            if (account === false) {
                //guest
            } else {
                if (queryProject.Leader.toString() == account.id) {
                    resObject.isLeader = true;
                }
            }
            res.json(Controller.Success(resObject));  
        
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http post, authen
    DeleteMember: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idProject = req.body.id_project;
            let idMember = req.body.id_member;

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await ProjectModel.getDataById(idProject,req.lang);
            let editProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            if (editProject.Leader.toString() != idAccount) {
                //not leader
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }
            if(idAccount==idMember){
                res.json(Controller.Fail(Message(req.lang,'member_unvalid')));
                return;
            }

            //delate member
            let resUpdateMember = await updateMember(req.lang,idProject,idMember,"",true);
            if(resUpdateMember.status==Controller.ResStatus.Fail){
                res.json(Controller.Fail(resUpdateMember.error));
            }
            res.json(Controller.Success({ isComplete:true }));  
            return;
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },
    //http post, authen
    UpdateMemberRole: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idProject = req.body.id_project;
            let idMember = req.body.id_member;
            let role = req.body.role;

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await ProjectModel.getDataById(idProject,req.lang);
            let editProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            if (editProject.Leader.toString() != idAccount) {
                //not leader
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }

            //update role member
            let resUpdateMember = await updateMember(req.lang,idProject,idMember,role,false);
            if(resUpdateMember.status==Controller.ResStatus.Fail){
                res.json(Controller.Fail(resUpdateMember.error));
            }
            res.json(Controller.Success({ isComplete:true }));  
            return;
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },

    //http get, authen
    GetCategoryKeywordsOfProject: async (req, res) => { 
        try {
            let idAccount = req.user.id;

            let idProject = req.query.id;

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resObject = new  ProjectResponse.CategoryKeywordList();

            let resAction = await ProjectModel.getDataByIdPopulateBasic(idProject,req.lang);
            let queryProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            
            //get category keyword
            let categoryKeywords = [];
            queryProject.CategoryKeyWords.forEach(cate => {
                if(cate.IsActive)
                categoryKeywords.push(
                    new ProjectResponse.CategoryKeyword(
                        cate._id,
                        cate.Name
                    )
                );
            });
            resObject.keywords = categoryKeywords;
            resObject.isLeader = queryProject.Leader.toString()==idAccount;
            
            res.json(Controller.Success(resObject));  
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http post, authen
    UpdateCategoryKeywordsOfProject: async (req, res) => { 
        try {
            let idAccount = req.user.id;

            let idProject = req.query.id;
            let categoryKeywordsId = JSON.parse(req.body.keywords)||[];

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            if (!Controller.isStringArray(categoryKeywordsId)) {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await ProjectModel.getDataById(idProject,req.lang);
            // let editProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            resAction = await CategoryKeywordModel.getAllCategoryKeywordsByUser(req.lang);
            let allKeywords = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            
            //get category keyword
            let categoryKeywordsUpdate = [];
            categoryKeywordsId.forEach(id => {
                let ind = allKeywords.findIndex(e=>e._id.toString()==id);
                if(ind!=-1){
                    categoryKeywordsUpdate.push(id);
                }
            });
            
            //update
            let updateFields = {$set:{
                CategoryKeyWords:categoryKeywordsUpdate
            }};

            resAction = await ProjectModel.updateProject(idProject, updateFields,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                res.json(Controller.Success({ isComplete:true }));  
                return;
            }
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },

    
}  
const updateMember = ProjectController.updateMember;
module.exports = ProjectController;