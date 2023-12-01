const ViewAlert = require('../view_models/ViewAlert');
const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var TeamModel = require('../models/TeamModel');  
var AccountModel = require('../models/AccountModel');  
var ChanelChatModel = require('../models/ChanelChatModel');  
var ChanelChatController = require('../controllers/ChanelChatController');  
var Auth = require('../core/Auth');  
const Mail = require('../core/Mail');
var Controller = require('./Controller');
const TeamProfileResponse = require("../client_data_response_models/TeamProfile");
const Path = require('path');

//containt the function with business logics  
var TeamController = {  
    //http post, authen
    Create : async function(req,res){  
        try {  
            let idAccount = req.user.id;

            let name = req.body.name;

            //valid
            let nameValid = TeamModel.isValidName(name, req.lang);
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
            let searchName = Controller.toNonAccentVietnamese(name).toLowerCase();

            const teamModel = {  
                Name: name,
                SearchName: searchName,
                Leader: idAccountObject,
                Members:[idAccountObject]
            };   
            resAction = await TeamModel.createTeam(teamModel,req.lang); 
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            } else {
                let newTeamid = resAction.data.id;

                resAction = await TeamModel.getDataById(newTeamid,req.lang);
                let queryTeam = resAction.data;
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return;
                }
                //create team chanel chat
                resAction = await ChanelChatModel.createTeamChanelChat(newTeamid,idAccount,req.lang);
                let chanelChat = resAction.data;
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return;
                }

                let editTeam = queryTeam;
                editTeam.ChanelChat = chanelChat.id;
                resAction = await TeamModel.updateTeam(newTeamid, editTeam,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));   
                    return;
                }
                let updateChanelChat = await ChanelChatController.updateMembersOfTeamChanelChat(editTeam.ChanelChat);


                queryTeam = await queryTeam.populate(
                    {
                        path: 'Leader',
                        select: '_id Name Avatar'
                    });

                let newTeam = new TeamProfileResponse.TeamListItem(
                    queryTeam.Name,
                    queryTeam._id,
                    queryTeam.Avatar,
                    queryTeam.Leader.Name,
                    queryTeam.Leader._id,
                    queryTeam.Leader.Avatar,
                    queryTeam.Members.length,
                    queryTeam.Leader._id.toString()==idAccount
                )
                //
                res.json(Controller.Success({ newTeam: newTeam }));
                return;
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
            let idTeam = req.body.id;

            if (idTeam == undefined || idTeam == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await TeamModel.getDataById(idTeam,req.lang);
            let editTeam = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            if (editTeam.Leader.toString() != idAccount) {
                //not leader
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return; 
            }

            console.log(req.files.avatar.size)
            console.log(req.files.avatar.name)
            //must upload image
            if (!req.files || !req.files.avatar) {
                res.json(Controller.Fail(Message(req.lang,'must_upload_file_image')));
                return; 
            } else if (req.files.avatar.size > Controller.Constant.TEAM_AVATAR_FILE_LIMIT_KB*1024) {
                res.json(Controller.Fail(Message(req.lang,'image_file_limit_size_kb').replace('{{size}}',Controller.Constant.TEAM_AVATAR_FILE_LIMIT_KB )));
                return; 
            } else {
                let image = req.files.avatar;
                console.log(image.mimetype)
                let fullPath = Path.join(__dirname,'..','public','images','teams_avatar');
                if (!image.mimetype.startsWith('image/')) {
                    res.json(Controller.Fail(Message(req.lang,'file_only_image')));
                    return; 
                } else {
                    //delete old
                    if (editTeam.Avatar!=null&&editTeam.Avatar!=""&&Controller.isExistPath(Path.join(fullPath, editTeam.Avatar))) {
                        if (!Controller.deleteFile(Path.join(fullPath, editTeam.Avatar))) {
                            res.json(Controller.Fail(Message(req.lang,'error_with_save_file')));
                            return; 
                        }
                    }
                    
                    let avatarPath = idTeam +"."+ image.name;
                    image.mv(Path.join(fullPath, avatarPath));
                    editTeam.Avatar = avatarPath;

                    //update
                    resAction = await TeamModel.updateTeam(idTeam, editTeam,req.lang);
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
    GetMyTeams: async (req, res) => { 
        try {
            let idAccount = req.user.id;

            let teams = [];

            let condition = {
                Members: { $in: [idAccount] }
            };
            let populate = {
                path: 'Leader',
                select: '_id Name Avatar'
            };

            // let resAction = await TeamModel.getTeams(condition,req.lang);
            let resAction = await TeamModel.getTeamsPopulate(condition,populate,req.lang);
            let queryTeams = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            queryTeams.forEach(element => {
                teams.push(
                    new TeamProfileResponse.TeamListItem(
                        element.Name,
                        element._id,
                        element.Avatar,
                        element.Leader.Name,
                        element.Leader._id,
                        element.Leader.Avatar,
                        element.Members.length,
                        element.Leader._id.toString()==idAccount
                    )
                );
            });
            
            res.json(Controller.Success({ teams: teams }));  
        
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },

    //http get, authen
    GetTeamsByLeader: async (req, res) => { 
        try {
            let idAccount = req.user.id;

            let teams = [];

            let condition = {
                Leader: idAccount
            };
            let populate = {
                path: 'Leader',
                select: '_id Name Avatar'
            };

            // let resAction = await TeamModel.getTeams(condition,req.lang);
            let resAction = await TeamModel.getTeamsPopulate(condition,populate,req.lang);
            let queryTeams = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            queryTeams.forEach(element => {
                teams.push(
                    new TeamProfileResponse.TeamListItem(
                        element.Name,
                        element._id,
                        element.Avatar,
                        element.Leader.Name,
                        element.Leader._id,
                        element.Leader.Avatar,
                        element.Members.length,
                        element.Leader._id.toString()==idAccount
                    )
                );
            });
            
            res.json(Controller.Success({ teams: teams }));  
        
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },

    //http get
    DetailsTeam: async (req, res) => { 
        try {

            let idTeam = req.query.id;

            let team = new  TeamProfileResponse.TeamDetails();

            let resAction = await TeamModel.getDataById(idTeam,req.lang);
            let queryTeam = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            queryTeam = await queryTeam.populate(
                {
                    path: 'Leader Members',
                    select: '_id Name Avatar Skills'
                });

            team.teamId = queryTeam._id;
            team.teamName = queryTeam.Name;
            team.teamAvatar = queryTeam.Avatar;
            team.leaderId = queryTeam.Leader._id;
            team.leaderName = queryTeam.Leader.Name;
            team.leaderAvatar = queryTeam.Leader.Avatar;
            team.maxim = queryTeam.Maxim;
            team.description = queryTeam.Description;
            
            
            //get member
            let members = [];

            let skills = [];

            queryTeam = await queryTeam.populate(
                {
                    path: 'Members.Skills',
                    select: '_id Name IsActive Image'
                });
            
        

            queryTeam.Members.forEach(member => {
                members.push(
                    new TeamProfileResponse.Member(
                        member._id,
                        member.Name,
                        member.Avatar,
                        member._id.toString()==team.leaderId
                    )
                );
                let memberSkills = member.Skills;
                memberSkills.forEach(skill => {
                    let skillExistIndex = skills.findIndex(a => a.id == skill._id.toString());
                    if (skillExistIndex == -1) {
                        skills.push(
                            new TeamProfileResponse.Skill(
                                skill._id,
                                skill.Name,
                                skill.Image,
                                1
                            )
                        )
                    } else {
                        skills[skillExistIndex].number++;
                    }
                });
            });
            team.members = members;
            team.skills = skills;

            //set relationship and internal info
            let account = await Auth.CheckAndGetAuthenUser(req);
            if (account === false) {
                //guest
                team.relationship = TeamProfileResponse.Relationship.Guest;
            } else {
                team.relationship=TeamProfileResponse.Relationship.UserLogin;
                
                if (team.leaderId == account.id) {
                    team.relationship+='.'+TeamProfileResponse.Relationship.Leader;
                }

                let checkMemberIndex = team.members.findIndex(a => a.id == account.id.toString());

                if (checkMemberIndex !== -1) {
                    team.relationship+='.'+TeamProfileResponse.Relationship.Member;
                    team.internalInfo = queryTeam.InternalInfo;
                    team.chanelChatId = queryTeam.ChanelChat;
                }

            }
            res.json(Controller.Success(team));  
        
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    
    //http post, authen
    EditInfo: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idTeam = req.body.id;

            if (idTeam == undefined || idTeam == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await TeamModel.getDataById(idTeam,req.lang);
            let editTeam = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            if (editTeam.Leader.toString() != idAccount) {
                //not leader
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return; 
            }
            
            editTeam.Name = req.body.name;
            let nameValid = TeamModel.isValidName(editTeam.Name, req.lang);
            if (!nameValid.isValid) {
                res.json(Controller.Fail(nameValid.error));
                return;
            }

            editTeam.Maxim = req.body.maxim;
            let maximValid = TeamModel.isValidMaxim(editTeam.Maxim, req.lang);
            if (!maximValid.isValid) {
                res.json(Controller.Fail(maximValid.error));
                return;
            }

            editTeam.Description = req.body.description;
            let descriptionValid = TeamModel.isValidDescription(editTeam.Description, req.lang);
            if (!descriptionValid.isValid) {
                res.json(Controller.Fail(descriptionValid.error));
                return;
            }

            editTeam.InternalInfo = req.body.internal_info;
            let internalInfoValid = TeamModel.isValidInternalInfo(editTeam.InternalInfo, req.lang);
            if (!internalInfoValid.isValid) {
                res.json(Controller.Fail(descriptionValid.error));
                return;
            }
            let searchName = Controller.toNonAccentVietnamese(editTeam.Name).toLowerCase();

            let updateFields = {$set:{
                Name:editTeam.Name,
                SearchName:searchName,
                InternalInfo:editTeam.InternalInfo,
                Maxim:editTeam.Maxim,
                Description:editTeam.Description
            }};
            //update
            resAction = await TeamModel.updateTeam(idTeam, updateFields,req.lang);
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
    ExitTeam: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idTeam = req.body.id_team;
            let idNewLeader = req.body.id_new_leader;

            if (idTeam == undefined || idTeam == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await TeamModel.getDataById(idTeam,req.lang);
            let editTeam = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            if (editTeam.Leader.toString() != idAccount) {
                //not leader
                let memberExistIndex = editTeam.Members.indexOf(idAccount);

                if (memberExistIndex == -1) {
                    //is not member
                    res.json(Controller.Fail(Message(req.lang, 'is_not_member')));
                    return; 
                }

                editTeam.Members.splice(memberExistIndex, 1);
            } else {
                //is leader

                let memberExistIndex = editTeam.Members.indexOf(idNewLeader);

                if (idAccount == idNewLeader||memberExistIndex==-1) {
                    res.json(Controller.Fail(Message(req.lang, 'new_leader_unvalid')));
                    return; 
                }

                //update new leader
                editTeam.Leader = idNewLeader;

                //exit member
                let memberExitIndex = editTeam.Members.indexOf(idAccount);
                if(memberExitIndex!=-1)editTeam.Members.splice(memberExitIndex, 1);
            }
            
            //update
            resAction = await TeamModel.updateTeam(idTeam, editTeam,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                let updateChanelChat = await ChanelChatController.updateMembersOfTeamChanelChat(editTeam.ChanelChat);
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
    GetMembers: async (req, res) => { 
        try {

            let idTeam = req.query.id;

            let resAction = await TeamModel.getDataById(idTeam,req.lang);
            let queryTeam = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            queryTeam = await queryTeam.populate(
                {
                    path: 'Members',
                    select: '_id Name Avatar'
                });

            let resObject = TeamProfileResponse.MembersList;
            
            //get members
            let members = [];

            queryTeam.Members.forEach(member => {
                members.push(
                    new TeamProfileResponse.Member(
                        member._id,
                        member.Name,
                        member.Avatar,
                        member._id.toString()==queryTeam.Leader.toString()
                    )
                );
            });
            resObject.members = members;

            //set relationship and internal info
            let account = await Auth.CheckAndGetAuthenUser(req);
            if (account === false) {
                //guest
            } else {
                if (queryTeam.Leader.toString() == account.id) {
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

            let idTeam = req.body.id_team;
            let idMember = req.body.id_member;

            if (idTeam == undefined || idTeam == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await TeamModel.getDataById(idTeam,req.lang);
            let editTeam = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            if (editTeam.Leader.toString() != idAccount) {
                //not leader
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }

            let memberDeleteIndex = editTeam.Members.indexOf(idMember);

            if (idAccount == idMember||memberDeleteIndex==-1) {
                res.json(Controller.Fail(Message(req.lang, 'member_unvalid')));
                return; 
            }

            //delete member
            editTeam.Members.splice(memberDeleteIndex, 1);
            
            //update
            resAction = await TeamModel.updateTeam(idTeam, editTeam,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                let updateChanelChat = await ChanelChatController.updateMembersOfTeamChanelChat(editTeam.ChanelChat);
                res.json(Controller.Success({ isComplete:true }));  
                return;
            }
            
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },
}  
  
module.exports = TeamController;