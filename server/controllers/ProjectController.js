const ViewAlert = require('../view_models/ViewAlert');
const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var ProjectModel = require('../models/ProjectModel');  
var CategoryKeywordModel = require('../models/CategoryKeywordModel');  
var NegativeReportKeywordModel = require('../models/NegativeReportKeywordModel');  
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
    GetMyProjectsAndInvitingRequest: async (req, res) => { 
        try {
            let idAccount = req.user.id;

            let resObject = new ProjectResponse.MyProjectsAndRequest();

            let resAction = await ProjectModel.getProjectsOfUser(idAccount,req.lang);
            let queryProjects = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            queryProjects.sort((a, b) => Controller.sortFunc(a.Name, b.Name, -1));

            queryProjects.forEach(element => {
                resObject.projects.push(
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
            resAction = await ProjectModel.getProjectsWithUserAsInvitingMember(idAccount,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            resObject.invitingRequestNumber=resAction.data.length;

            res.json(Controller.Success(resObject));  
        
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
            project.slogan = queryProject.Slogan;
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
                    project.invitingMembersNumber=queryProject.InvitingMembers.length;
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
            project.reportsNumber=queryProject.NegativeReports.length;

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

            editProject.Slogan = req.body.slogan;
            let sloganValid = ProjectModel.isValidSlogan(editProject.Slogan, req.lang);
            if (!sloganValid.isValid) {
                res.json(Controller.Fail(sloganValid.error));
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
                Slogan:editProject.Slogan,
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

            if (queryProject.Leader.toString() != idAccount) {
                //not leader
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return; 
            }
            
            let editBasicInfo = new ProjectResponse.EditBasicInfo();
            editBasicInfo.name = queryProject.Name;
            editBasicInfo.slogan = queryProject.Slogan;
            editBasicInfo.description = queryProject.Description;

            res.json(Controller.Success(editBasicInfo ));  
            return;
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },

    //http get, authen
    GetTags: async (req,res) => {
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
            
            let tags = editProject.Tags;
            res.json(Controller.Success({ tags:tags }));  
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
            tags = tags.map(e=>Controller.toNonAccentVietnamese(e).toLowerCase()).filter(e=>e.length!=0);

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
                res.json(Controller.Success({ tags: tags}));  
                return;
            }
            
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },

    //http post, authen
    ToggleFollow: async (req,res) => {
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
            
            let resOj = {totalFollows:0,isFollow:false};
            if(indexFollow!=-1){
                //unfollow
                editProject.UserFollows.splice(indexFollow,1);
                resOj.isFollow=false;
            }else{
                editProject.UserFollows.push(idAccount);
                resOj.isFollow=true;
            }
            //update
            let updateFields = {$set:{
                UserFollows:editProject.UserFollows
            }};
            resOj.totalFollows = editProject.UserFollows.length;

            resAction = await ProjectModel.updateProject(idProject, updateFields,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                res.json(Controller.Success(resOj));  
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

                if (editProject.Members.length!=1&&(idAccount == idNewLeader||memberExistIndex==-1)) {
                    res.json(Controller.Fail(Message(req.lang, 'new_leader_unvalid')));
                    return; 
                }

                //update new leader
                if(editProject.Members.length==1){
                    //project not leader
                    editProject.Leader=null
                }else{
                    editProject.Leader = idNewLeader;
                }
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

            queryProject = await queryProject.populate("MembersHistory.User");

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
            let roleValid = ProjectModel.isValidMemberRole(role, language);
            if (!roleValid.isValid) {
                res.json(Controller.Fail(roleValid.error));
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

    //http post, authen
    InviteNewMember: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idProject = req.body.id_project;
            let emailNewMember = req.body.email_new_member;
            let role = req.body.role;

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }
            if (emailNewMember == undefined || emailNewMember == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }
            let roleValid = ProjectModel.isValidMemberRole(role, language);
            if (!roleValid.isValid) {
                res.json(Controller.Fail(roleValid.error));
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

            resAction = await AccountModel.getDataByEmail(emailNewMember,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let idNewMember = resAction.data._id;

            let index = editProject.InvitingMembers.findIndex(e=>e.User.toString()==idNewMember);
            if(index==-1){
                let invitingMember = new ProjectModel.ProjectInvitingMember();
                invitingMember.User = idNewMember;
                invitingMember.Time = Date.now();
                invitingMember.Role = role;
                editProject.InvitingMembers.push(invitingMember);
            }else{
                res.json(Controller.Fail(Message(req.lang, "only_one_request_one_time")));
                return;
            }
            //update
            let updateFields = {$set:{
                InvitingMembers:editProject.InvitingMembers
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
    UpdateInvitingMember: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idProject = req.body.id_project;
            let idInvitingMember = req.body.id_inviting_member;
            let status = req.body.status;

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }
            if (status != "agree" && status != "disagree" && status != "cencel") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await ProjectModel.getDataById(idProject,req.lang);
            let editProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            //check permission
            if(status=="cancel"){
                if (idInvitingMember == undefined || idInvitingMember == "") {
                    res.json(Controller.Fail(Message(req.lang, "system_error")));
                    return; 
                }
                if (editProject.Leader.toString() != idAccount) {
                    //not leader
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return;
                }
            }else if(status=="agree"){
                idInvitingMember = idAccount;
            }else {
                //disagree
                idInvitingMember = idAccount;
            }

            let indexDelete = editProject.InvitingMembers.findIndex(e=>e.User.toString()==idInvitingMember);
            
            if(status=="agree"){
                //check exist in inviting member
                if(indexDelete==-1){
                    //not exist
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return;
                }

                let resUpdateMember = await updateMember(req.lang,idProject,idInvitingMember,editProject.InvitingMembers[indexDelete].Role,false);
                if(resUpdateMember.status==Controller.ResStatus.Fail){
                    res.json(Controller.Fail(resUpdateMember.error));
                }
            }

            if(indexDelete!=-1){
                editProject.InvitingMembers.splice(index,1);
                //update
                let updateFields = {$set:{
                    InvitingMembers:editProject.InvitingMembers
                }};

                resAction = await ProjectModel.updateProject(idProject, updateFields,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));   
                    return;
                }
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
    GetInvitingMembersOfProject: async (req, res) => { 
        try {
            let idProject = req.query.id;

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
            if (queryProject.Leader.toString() != idAccount) {
                //not leader
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }
            
            queryProject = await queryProject.populate("InvitingMembers.User");
            let resInvitingMembers =[];
           
            queryProject.InvitingMembers.forEach(member => {
                resInvitingMembers.push(
                    new ProjectResponse.InvitingMember(
                        member.User._id,
                        member.User.Name,
                        member.User.Avatar,
                        member.Role,
                        member.Time
                    )
                );
            });
            
            res.json(Controller.Success({invitingMembers:resInvitingMembers}));  
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http get, authen
    GetInvitingMembersOfUser: async (req, res) => { 
        try {
            let idAccount = req.user.id;

            let resAction = await ProjectModel.getProjectsWithUserAsInvitingMember(idAccount,req.lang);
            let queryProjects = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            
            let resInvitingProjects =[];
            queryProjects.forEach(pro=>{
                let ind = pro.InvitingMembers.findIndex(e=>e.User.toString()==idAccount);
                if(ind==-1){
                    res.json(Controller.Fail(Message(req.lang,"system_error"))); 
                    return;
                }
                resInvitingProjects.push(
                    new ProjectResponse.InvitingProject(
                        pro._id,
                        pro.Name,
                        pro.Avatar,
                        pro.InvitingMembers[ind].Role,
                        pro.InvitingMembers[ind].Time
                    )
                );
            });
            
            res.json(Controller.Success({invitingProjects:resInvitingProjects}));  
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
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

            if (queryProject.Leader._id.toString() != idAccount) {
                //not leader
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
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
            resObject.isLeader = true;
            
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

    //http post, authen
    UploadResource: async (req,res) => {
        try {
            let idAccount = req.user.id;
            let idProject = req.body.id;
            let type = req.body.type;
            let alt = req.body.alt;

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }
            if (type != "image" && type != "video") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let altValid = ProjectModel.isValidResourceAlt(alt, language);
            if (!altValid.isValid) {
                res.json(Controller.Fail(altValid.error));
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

            let fullPath = Path.join(__dirname,'..','public','images','projects',idProject);
            if(!Controller.isExistPath(fullPath)){
                Controller.createDirectory(fullPath);
            }

            let updateFields;
            let newResource;

            if(type=="image"){
                //must upload image
                if (!req.files || !req.files.image) {
                    res.json(Controller.Fail(Message(req.lang,'must_upload_file_image')));
                    return; 
                } else if (req.files.image.size > Controller.Constant.PROJECT_IMAGE_RESOURCE_LIMIT_KB*1024) {
                    res.json(Controller.Fail(Message(req.lang,'image_file_limit_size_kb').replace('{{size}}',Controller.Constant.PROJECT_IMAGE_RESOURCE_LIMIT_KB )));
                    return; 
                } else {
                    let image = req.files.image;
                    console.log(image.mimetype)
                    
                    if (!image.mimetype.startsWith('image/')) {
                        res.json(Controller.Fail(Message(req.lang,'file_only_image')));
                        return; 
                    } else {
                        
                        let filePath = idProject +"."+ image.name;
                        image.mv(Path.join(fullPath, filePath));
                        filePath=Path.join(idProject,filePath).toString();
                        console.log("file path:"+filePath);

                        //update
                        newResource = new ProjectModel.ProjectResource(filePath,alt);
                        editProject.Images.push(newResource);
                        updateFields = {$set:{Images:editProject.Images}};
                    }
                }
            }else{
                //must upload video
                if (!req.files || !req.files.video) {
                    res.json(Controller.Fail(Message(req.lang,'must_upload_file_video')));
                    return; 
                } else if (req.files.video.size > Controller.Constant.PROJECT_VIDEO_RESOURCE_LIMIT_KB*1024) {
                    res.json(Controller.Fail(Message(req.lang,'video_file_limit_size_kb').replace('{{size}}',Controller.Constant.PROJECT_VIDEO_RESOURCE_LIMIT_KB )));
                    return; 
                } else {
                    let video = req.files.video;
                    console.log(video.mimetype)
                    
                    if (!video.mimetype.startsWith('video/')) {
                        res.json(Controller.Fail(Message(req.lang,'file_only_video')));
                        return; 
                    } else {
                        
                        let filePath = idProject +"."+ video.name;
                        video.mv(Path.join(fullPath, filePath));
                        filePath=Path.join(idProject,filePath).toString();
                        console.log("file path:"+filePath);

                        //update
                        newResource = new ProjectModel.ProjectResource(filePath,alt);
                        editProject.Videos.push(newResource);
                        updateFields = {$set:{Videos:editProject.Videos}};
                    }
                }
            }
            
            resAction = await ProjectModel.updateProject(idProject, updateFields,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                res.json(Controller.Success({ path: newResource.Path, alt: newResource.Alt }));  
                return;
            }
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },
    //http post, authen
    DeleteResource: async (req,res) => {
        try {
            let idAccount = req.user.id;
            let idProject = req.body.id;
            let type = req.body.type;
            let path = req.body.path;

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }
            if (path == undefined || path == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }
            if (type != "image" && type != "video") {
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

            let fullPath = Path.join(__dirname,'..','public','images','projects');
            
            let updateFields;

            if(type=="image"){
                let indexDelete = editProject.Images.findIndex(e=>e.Path==path);
                if(indexDelete==-1){
                    res.json(Controller.Fail(Message(req.lang,'resource_not_exist')));
                    return; 
                }
                editProject.Images.splice(indexDelete,1);
                updateFields = {$set:{Images:editProject.Images}};
            }else{
                let indexDelete = editProject.Videos.findIndex(e=>e.Path==path);
                if(indexDelete==-1){
                    res.json(Controller.Fail(Message(req.lang,'resource_not_exist')));
                    return; 
                }
                editProject.Videos.splice(indexDelete,1);
                updateFields = {$set:{Videos:editProject.Videos}};
            }
            //delete old file
            if (Controller.isExistPath(Path.join(fullPath, path))) {
                if (!Controller.deleteFile(Path.join(fullPath, path))) {
                    res.json(Controller.Fail(Message(req.lang,'error_with_delete_file')));
                    return; 
                }
            }
            
            resAction = await ProjectModel.updateProject(idProject, updateFields,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                res.json(Controller.Success({ path: newResource.Path, alt: newResource.Alt }));  
                return;
            }
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },
    //http get
    GetResources: async (req,res) => {
        try {
            let idProject = req.body.id;
            let type = req.body.type;

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }
            if (type != "image" && type != "video") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await ProjectModel.getDataById(idProject,req.lang);
            let queryProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            let resResources = new ProjectResponse.Resources();
            let account = await Auth.CheckAndGetAuthenUser(req);
            if (account === false) {
            } else if (queryProject.Leader.toString() == account.id.toString()) {
                resResources.isLeader=true;
            }
            if(type=="image"){  
                resResources.resources = queryProject.Images.map(e=>new ProjectResponse.Resource(e.Path,e.Alt));
            }else{
                resResources.resources = queryProject.Videos.map(e=>new ProjectResponse.Resource(e.Path,e.Alt));
            }
            
            res.json(Controller.Success(resResources));  
            return;
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },

    //http post, authen
    UpdateNegativeReports: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idProject = req.body.id;
            let negativeReportKeywordsId = JSON.parse(req.body.keywords)||[];

            if (idProject == undefined || idProject == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            if (!Controller.isStringArray(negativeReportKeywordsId)) {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await ProjectModel.getDataById(idProject,req.lang);
            let editProject = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            //get all keywords
            resAction = await NegativeReportKeywordModel.getAllNegativeReportKeywordsByUser(req.lang);
            let allKeywords = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            
            let keywordsUpdate = [];
            negativeReportKeywordsId.forEach(id => {
                let ind = allKeywords.findIndex(e=>e._id.toString()==id);
                if(ind!=-1){
                    keywordsUpdate.push(id);
                }
            });

            let userReportIndex = editProject.NegativeReports.findIndex(e=>e.User.toString()==idAccount);
            if(userReportIndex==-1){
                //add
                let userNegativeReports = new ProjectModel.ProjectNegativeReport();
                userNegativeReports.User = idAccount;
                userNegativeReports.NegativeReports = keywordsUpdate;
                userNegativeReports.Time = Date.now();
                editProject.NegativeReports.push(userNegativeReports);
            }else{
                if(keywordsUpdate.length==0){
                    //delete
                    editProject.NegativeReports.splice(userReportIndex,1);
                }else{
                    //change
                    editProject.NegativeReports[userReportIndex].NegativeReports = keywordsUpdate;
                }
            }
            //update
            let updateFields = {$set:{
                NegativeReports:editProject.NegativeReports
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
    GetMyNegativeReports: async (req,res) => {
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

            let resNegativeReports = new ProjectResponse.GeneralNegativeReports();
            let index = queryProject.NegativeReports.findIndex(e=>e.User.toString()==idAccount);
            if(index!=-1){
                queryProject = await queryProject.populate("NegativeReports.NegativeReports");
                resNegativeReports.reports=queryProject.NegativeReports[index].NegativeReports.filter(e=>e.IsActive==true).map(e=>new ProjectResponse.GeneralNegativeReport(e._id,1));
            }
            
            res.json(Controller.Success(resNegativeReports));  
            return;
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },
    //http get
    GetGeneralNegativeReports: async (req,res) => {
        try {
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

            let resNegativeReports = new ProjectResponse.NegativeReports();
            
            queryProject = await queryProject.populate("NegativeReports.NegativeReports");
            queryProject.NegativeReports.forEach(nrs=>{
                nrs.NegativeReports.forEach(nr=>{
                    let existInd = resNegativeReports.reports.findIndex(e=>e.id==nr._id.toString());
                    if(existInd==-1){
                        //add
                        resNegativeReports.reports.push(new ProjectResponse.GeneralNegativeReport(nr._id.toString(),1));
                    }else{
                        //plus
                        resNegativeReports.reports[existInd].number++;
                    }
                });
            });
            
            res.json(Controller.Success(resNegativeReports));  
            return;
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },


}  
const updateMember = ProjectController.updateMember;
module.exports = ProjectController;