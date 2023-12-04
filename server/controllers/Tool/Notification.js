const NotificationContant = require("../../notification_constants/NotificationContant");
const NotificationModel = require('../../models/NotificationModel');
const NotificationController = require('../NotificationController');


// ReceiveUser: null,
// CreatedAt: 0,
// WasRead: false,
// TypeCode: 0,
// Key: "",
// Direction: "",
// Subjects: [],
// SubjectCount: 0,
// MainObject: null,
// SubObject: null,
// ContextObject: null,

// NotificationTool.Friend.sendFriendRequest(
//     req,
//     receiveUser._id.toString(),
//     resAction.data.id,
//     idAccount,
//     nameAccount);

const GroupChat={
    insertUsersToGroupChat: async (
        req, 
        receiveIdUsers, 
        acctionUserId, 
        acctionUserName,
        idGroupChat, 
        nameGroupChat)=>{
            try{
                for(let e in receiveIdUsers){
                    let notification = new NotificationModel.getNotificationAsObject();
                    notification.ReceiveUser = receiveIdUsers[e];
                    notification.CreatedAt = Date.now();
                    notification.TypeCode = NotificationContant.TypeNotification.GroupChat.AddYouIntoGroupChat.Code;
                    notification.Key = NotificationContant.generatesKey(notification.TypeCode,idGroupChat);
                    notification.Direction = NotificationContant.DirectLink.ChanelChat.Details(idGroupChat);
                    notification.Subjects = [NotificationModel.getNotificationObjectAsObject(acctionUserId,acctionUserName,NotificationContant.TypeObject.Account)];
                    notification.SubjectCount = 1;
                    notification.SubObject = NotificationModel.getNotificationObjectAsObject(idGroupChat,nameGroupChat,NotificationContant.TypeObject.ChanelChat);
                    //add
                    let res = await NotificationController.createOrUpdateNotification(req, notification,true);
                };
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
    changeNameGroupChat: async (
        req, 
        receiveIdUsers,
        acctionUserId, 
        acctionUserName, 
        oldNameGroupChat, 
        idGroupChat, 
        newNameGroupChat)=>{
            try{
                for(let e in receiveIdUsers){
                    let notification = new NotificationModel.getNotificationAsObject();
                    notification.ReceiveUser = receiveIdUsers[e];
                    notification.CreatedAt = Date.now();
                    notification.TypeCode = NotificationContant.TypeNotification.GroupChat.ChangeNameGroupChat.Code;
                    notification.Key = NotificationContant.generatesKey(notification.TypeCode,idGroupChat);
                    notification.Direction = NotificationContant.DirectLink.ChanelChat.Details(idGroupChat);
                    notification.Subjects = [NotificationModel.getNotificationObjectAsObject(acctionUserId,acctionUserName,NotificationContant.TypeObject.Account)];
                    notification.SubjectCount = 1;
                    notification.MainObject = NotificationModel.getNotificationObjectAsObject(idGroupChat,newNameGroupChat,NotificationContant.TypeObject.ChanelChat);
                    notification.SubObject = NotificationModel.getNotificationObjectAsObject("",oldNameGroupChat,NotificationContant.TypeObject.None);
                    //add
                    let res = await NotificationController.createOrUpdateNotification(req, notification,true);
                };
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    }
}
const Friend={
    sendFriendRequest: async (
        req, 
        receiveUserId,
        requestId, 
        sendUserId,
        sendUserName)=>{
            try{
                let notification = new NotificationModel.getNotificationAsObject();
                notification.ReceiveUser = receiveUserId;
                notification.CreatedAt = Date.now();
                notification.TypeCode = NotificationContant.TypeNotification.Friend.SendYouFriendRequest.Code;
                notification.Key = NotificationContant.generatesKey(notification.TypeCode,sendUserId);
                notification.Direction = NotificationContant.DirectLink.Friend.Request.Details(requestId);
                notification.Subjects = [NotificationModel.getNotificationObjectAsObject(sendUserId,sendUserName,NotificationContant.TypeObject.Account)];
                notification.SubjectCount = 1;
                //add
                let res = await NotificationController.createOrUpdateNotification(req, notification,true);
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
    becomeFriend: async (
        req, 
        receiveUserId,
        friendId,
        friendName)=>{
            try{
                let notification = new NotificationModel.getNotificationAsObject();
                notification.ReceiveUser = receiveUserId;
                notification.CreatedAt = Date.now();
                notification.TypeCode = NotificationContant.TypeNotification.Friend.BecomeFriend.Code;
                notification.Key = NotificationContant.generatesKey(notification.TypeCode,friendId);
                notification.Direction = NotificationContant.DirectLink.Account.Details(friendId);
                notification.Subjects = [NotificationModel.getNotificationObjectAsObject(friendId,friendName,NotificationContant.TypeObject.Account)];
                notification.SubjectCount = 1;
                //add
                let res = await NotificationController.createOrUpdateNotification(req, notification,true);
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
}
const TeamRequest={
    sendRecruitRequest: async (
        req, 
        receiveUserId,
        sendUserId,
        sendUserName,
        teamId,
        teamName)=>{
            try{
                let notification = new NotificationModel.getNotificationAsObject();
                notification.ReceiveUser = receiveUserId;
                notification.CreatedAt = Date.now();
                notification.TypeCode = NotificationContant.TypeNotification.TeamRequest.SendYouTeamRecruitRequest.Code;
                notification.Key = NotificationContant.generatesKey(notification.TypeCode,teamId);
                notification.Subjects = [NotificationModel.getNotificationObjectAsObject(sendUserId,sendUserName,NotificationContant.TypeObject.Account)];
                notification.SubjectCount = 1;
                notification.MainObject = NotificationModel.getNotificationObjectAsObject(teamId,teamName,NotificationContant.TypeObject.Team);
                //add
                let res = await NotificationController.createOrUpdateNotification(req, notification,true);
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
    sendJoinRequest: async (
        req, 
        receiveUserId,
        sendUserId,
        sendUserName,
        teamId,
        teamName)=>{
            try{
                let notification = new NotificationModel.getNotificationAsObject();
                notification.ReceiveUser = receiveUserId;
                notification.CreatedAt = Date.now();
                notification.TypeCode = NotificationContant.TypeNotification.TeamRequest.SendYouTeamJoinRequest.Code;
                notification.Key = NotificationContant.generatesKey(notification.TypeCode,teamId);
                notification.Subjects = [NotificationModel.getNotificationObjectAsObject(sendUserId,sendUserName,NotificationContant.TypeObject.Account)];
                notification.SubjectCount = 1;
                notification.MainObject = NotificationModel.getNotificationObjectAsObject(teamId,teamName,NotificationContant.TypeObject.Team);
                //add
                let res = await NotificationController.createOrUpdateNotification(req, notification,false);
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
    ResponseStatus:{
        Agree:"agree",
        Disagree:"disagree",
        Cancel:"cancel",
    },
    RequestType:{
        Join:"join",
        Recruit:"recruit"
    },
    responseRequest: async (
        req, 
        receiveUserId,
        sendUserId,
        sendUserName,
        teamId,
        teamName,
        requestType,
        responseStatus)=>{
            try{
                let notification = new NotificationModel.getNotificationAsObject();
                notification.ReceiveUser = receiveUserId;
                notification.CreatedAt = Date.now();
                if(requestType==TeamRequestType.Join){
                    if(responseStatus==TeamResponseStatus.Agree){
                        notification.TypeCode = NotificationContant.TypeNotification.TeamRequest.UserAgreeTeamJoinRequest.Code;
                    }else if(responseStatus==TeamResponseStatus.Disagree){
                        notification.TypeCode = NotificationContant.TypeNotification.TeamRequest.UserDisagreeTeamJoinRequest.Code;
                    }else {
                        notification.TypeCode = NotificationContant.TypeNotification.TeamRequest.UserCancelTeamJoinRequest.Code;
                    }
                }else{
                    if(responseStatus==TeamResponseStatus.Agree){
                        notification.TypeCode = NotificationContant.TypeNotification.TeamRequest.UserAgreeTeamRecruitRequest.Code;
                    }else if(responseStatus==TeamResponseStatus.Disagree){
                        notification.TypeCode = NotificationContant.TypeNotification.TeamRequest.UserDisagreeTeamRecruitRequest.Code;
                    }else {
                        notification.TypeCode = NotificationContant.TypeNotification.TeamRequest.UserCancelTeamRecruitRequest.Code;
                    }
                }
                notification.Key = NotificationContant.generatesKey(notification.TypeCode,teamId);
                notification.Subjects = [NotificationModel.getNotificationObjectAsObject(sendUserId,sendUserName,NotificationContant.TypeObject.Account)];
                notification.SubjectCount = 1;
                notification.MainObject = NotificationModel.getNotificationObjectAsObject(teamId,teamName,NotificationContant.TypeObject.Team);
                //add
                let res = await NotificationController.createOrUpdateNotification(req, notification,false);
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
}
const TeamRequestType = TeamRequest.RequestType;
const TeamResponseStatus = TeamRequest.ResponseStatus;

const Team={
    userJoinTeam: async (
        req, 
        receiveIdUsers, 
        acctionUserId, 
        acctionUserName,
        teamId, 
        teamName)=>{
            try{
                for(let e in receiveIdUsers){
                    let notification = new NotificationModel.getNotificationAsObject();
                    notification.ReceiveUser = receiveIdUsers[e];
                    notification.CreatedAt = Date.now();
                    notification.TypeCode = NotificationContant.TypeNotification.Team.UserJoinTeam.Code;
                    notification.Key = NotificationContant.generatesKey(notification.TypeCode,teamId);
                    notification.Direction = NotificationContant.DirectLink.Team.Members(teamId);
                    notification.Subjects = [NotificationModel.getNotificationObjectAsObject(acctionUserId,acctionUserName,NotificationContant.TypeObject.Account)];
                    notification.SubjectCount = 1;
                    notification.MainObject = NotificationModel.getNotificationObjectAsObject(teamId,teamName,NotificationContant.TypeObject.Team);
                    //add
                    let res = await NotificationController.createOrUpdateNotification(req, notification,false);
                };
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
    userOutTeam: async (
        req, 
        receiveIdUsers, 
        acctionUserId, 
        acctionUserName,
        teamId, 
        teamName)=>{
            try{
                for(let e in receiveIdUsers){
                    let notification = new NotificationModel.getNotificationAsObject();
                    notification.ReceiveUser = receiveIdUsers[e];
                    notification.CreatedAt = Date.now();
                    notification.TypeCode = NotificationContant.TypeNotification.Team.UserOutTeam.Code;
                    notification.Key = NotificationContant.generatesKey(notification.TypeCode,teamId);
                    notification.Direction = NotificationContant.DirectLink.Team.Members(teamId);
                    notification.Subjects = [NotificationModel.getNotificationObjectAsObject(acctionUserId,acctionUserName,NotificationContant.TypeObject.Account)];
                    notification.SubjectCount = 1;
                    notification.MainObject = NotificationModel.getNotificationObjectAsObject(teamId,teamName,NotificationContant.TypeObject.Team);
                    //add
                    let res = await NotificationController.createOrUpdateNotification(req, notification,false);
                };
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
    changeNameTeam: async (
        req, 
        receiveIdUsers,
        acctionUserId, 
        acctionUserName, 
        oldNameTeam, 
        idTeam, 
        newNameTeam)=>{
            try{
                for(let e in receiveIdUsers){
                    let notification = new NotificationModel.getNotificationAsObject();
                    notification.ReceiveUser = receiveIdUsers[e];
                    notification.CreatedAt = Date.now();
                    notification.TypeCode = NotificationContant.TypeNotification.Team.ChangeNameTeam.Code;
                    notification.Key = NotificationContant.generatesKey(notification.TypeCode,idTeam);
                    notification.Direction = NotificationContant.DirectLink.Team.Details(idTeam);
                    notification.Subjects = [NotificationModel.getNotificationObjectAsObject(acctionUserId,acctionUserName,NotificationContant.TypeObject.Account)];
                    notification.SubjectCount = 1;
                    notification.MainObject = NotificationModel.getNotificationObjectAsObject(idTeam,newNameTeam,NotificationContant.TypeObject.Team);
                    notification.SubObject = NotificationModel.getNotificationObjectAsObject("",oldNameTeam,NotificationContant.TypeObject.None);
                    //add
                    let res = await NotificationController.createOrUpdateNotification(req, notification,true);
                };
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    }
}
const Project={
    userJoinProject: async (
        req, 
        receiveIdUsers, 
        acctionUserId, 
        acctionUserName,
        acctionUserRoleOfProject,
        projectId, 
        projectName)=>{
            try{
                for(let e in receiveIdUsers){
                    let notification = new NotificationModel.getNotificationAsObject();
                    notification.ReceiveUser = receiveIdUsers[e];
                    notification.CreatedAt = Date.now();
                    notification.TypeCode = NotificationContant.TypeNotification.Project.UserJoinProject.Code;
                    notification.Key = NotificationContant.generatesKey(notification.TypeCode,projectId+"_"+acctionUserId);
                    notification.Direction = NotificationContant.DirectLink.Project.Members(projectId);
                    notification.Subjects = [NotificationModel.getNotificationObjectAsObject(acctionUserId,acctionUserName,NotificationContant.TypeObject.Account)];
                    notification.SubjectCount = 1;
                    notification.MainObject = NotificationModel.getNotificationObjectAsObject(projectId,projectName,NotificationContant.TypeObject.Project);
                    notification.SubObject = NotificationModel.getNotificationObjectAsObject("",acctionUserRoleOfProject,NotificationContant.TypeObject.None);
                    //add
                    let res = await NotificationController.createOrUpdateNotification(req, notification,true);
                };
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
    userChangeRole: async (
        req, 
        receiveIdUsers, 
        acctionUserId, 
        acctionUserName,
        acctionUserRoleOfProject,
        projectId, 
        projectName)=>{
            try{
                for(let e in receiveIdUsers){
                    let notification = new NotificationModel.getNotificationAsObject();
                    notification.ReceiveUser = receiveIdUsers[e];
                    notification.CreatedAt = Date.now();
                    notification.TypeCode = NotificationContant.TypeNotification.Project.UserChangeRole.Code;
                    notification.Key = NotificationContant.generatesKey(notification.TypeCode,projectId+"_"+acctionUserId);
                    notification.Direction = NotificationContant.DirectLink.Project.Members(projectId);
                    notification.Subjects = [NotificationModel.getNotificationObjectAsObject(acctionUserId,acctionUserName,NotificationContant.TypeObject.Account)];
                    notification.SubjectCount = 1;
                    notification.MainObject = NotificationModel.getNotificationObjectAsObject(projectId,projectName,NotificationContant.TypeObject.Project);
                    notification.SubObject = NotificationModel.getNotificationObjectAsObject("",acctionUserRoleOfProject,NotificationContant.TypeObject.None);
                    //add
                    let res = await NotificationController.createOrUpdateNotification(req, notification,true);
                };
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
    userOutProject: async (
        req, 
        receiveIdUsers, 
        acctionUserId, 
        acctionUserName,
        projectId, 
        projectName)=>{
            try{
                for(let e in receiveIdUsers){
                    let notification = new NotificationModel.getNotificationAsObject();
                    notification.ReceiveUser = receiveIdUsers[e];
                    notification.CreatedAt = Date.now();
                    notification.TypeCode = NotificationContant.TypeNotification.Project.UserOutProject.Code;
                    notification.Key = NotificationContant.generatesKey(notification.TypeCode,projectId);
                    notification.Direction = NotificationContant.DirectLink.Project.Members(projectId);
                    notification.Subjects = [NotificationModel.getNotificationObjectAsObject(acctionUserId,acctionUserName,NotificationContant.TypeObject.Account)];
                    notification.SubjectCount = 1;
                    notification.MainObject = NotificationModel.getNotificationObjectAsObject(projectId,projectName,NotificationContant.TypeObject.Project);
                    //add
                    let res = await NotificationController.createOrUpdateNotification(req, notification,false);
                };
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
    changeNameProject: async (
        req, 
        receiveIdUsers,
        acctionUserId, 
        acctionUserName, 
        oldNameProject, 
        idProject, 
        newNameProject)=>{
            try{
                for(let e in receiveIdUsers){
                    let notification = new NotificationModel.getNotificationAsObject();
                    notification.ReceiveUser = receiveIdUsers[e];
                    notification.CreatedAt = Date.now();
                    notification.TypeCode = NotificationContant.TypeNotification.Project.ChangeNameProject.Code;
                    notification.Key = NotificationContant.generatesKey(notification.TypeCode,idProject);
                    notification.Direction = NotificationContant.DirectLink.Project.Details(idProject);
                    notification.Subjects = [NotificationModel.getNotificationObjectAsObject(acctionUserId,acctionUserName,NotificationContant.TypeObject.Account)];
                    notification.SubjectCount = 1;
                    notification.MainObject = NotificationModel.getNotificationObjectAsObject(idProject,newNameProject,NotificationContant.TypeObject.Project);
                    notification.SubObject = NotificationModel.getNotificationObjectAsObject("",oldNameProject,NotificationContant.TypeObject.None);
                    //add
                    let res = await NotificationController.createOrUpdateNotification(req, notification,true);
                };
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
    sendInvitingRequest: async (
        req, 
        receiveUserId,
        sendUserId,
        sendUserName,
        projectId,
        projectName)=>{
            try{
                let notification = new NotificationModel.getNotificationAsObject();
                notification.ReceiveUser = receiveUserId;
                notification.CreatedAt = Date.now();
                notification.TypeCode = NotificationContant.TypeNotification.Project.SendYouInvitingRequest.Code;
                notification.Key = NotificationContant.generatesKey(notification.TypeCode,projectId);
                notification.Direction = NotificationContant.DirectLink.Project.RequestsOfUser();
                notification.Subjects = [NotificationModel.getNotificationObjectAsObject(sendUserId,sendUserName,NotificationContant.TypeObject.Account)];
                notification.SubjectCount = 1;
                notification.MainObject = NotificationModel.getNotificationObjectAsObject(projectId,projectName,NotificationContant.TypeObject.Project);
                //add
                let res = await NotificationController.createOrUpdateNotification(req, notification,true);
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
    ResponseStatus:{
        Agree:"agree",
        Disagree:"disagree",
        Cancel:"cancel",
    },
    responseRequest: async (
        req, 
        receiveUserId,
        sendUserId,
        sendUserName,
        projectId,
        projectName,
        responseStatus)=>{
            try{
                let notification = new NotificationModel.getNotificationAsObject();
                notification.ReceiveUser = receiveUserId;
                notification.CreatedAt = Date.now();
                if(responseStatus==ProjectResponseStatus.Agree){
                    notification.TypeCode = NotificationContant.TypeNotification.Project.UserAgreeInvitingRequest.Code;
                }else if(responseStatus==ProjectResponseStatus.Disagree){
                    notification.TypeCode = NotificationContant.TypeNotification.Project.UserDisagreeInvitingRequest.Code;
                }else {
                    notification.TypeCode = NotificationContant.TypeNotification.Project.UserCancelInvitingRequest.Code;
                }
                notification.Key = NotificationContant.generatesKey(notification.TypeCode,projectId);
                notification.Subjects = [NotificationModel.getNotificationObjectAsObject(sendUserId,sendUserName,NotificationContant.TypeObject.Account)];
                notification.SubjectCount = 1;
                notification.MainObject = NotificationModel.getNotificationObjectAsObject(projectId,projectName,NotificationContant.TypeObject.Project);
                //add
                let res = await NotificationController.createOrUpdateNotification(req, notification,false);
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
}
const ProjectResponseStatus = Project.ResponseStatus;

const Post={
    projectCreateNewPost: async (
        req, 
        receiveIdUsers, 
        newPostId,
        projectId, 
        projectName)=>{
            try{
                for(let e in receiveIdUsers){
                    let notification = new NotificationModel.getNotificationAsObject();
                    notification.ReceiveUser = receiveIdUsers[e];
                    notification.CreatedAt = Date.now();
                    notification.TypeCode = NotificationContant.TypeNotification.Post.ProjectCreateNewPost.Code;
                    notification.Key = NotificationContant.generatesKey(notification.TypeCode,projectId);
                    notification.Direction = NotificationContant.DirectLink.Post.Details(newPostId);
                    notification.Subjects = [NotificationModel.getNotificationObjectAsObject(projectId,projectName,NotificationContant.TypeObject.Project)];
                    notification.SubjectCount = 1;
                    //add
                    let res = await NotificationController.createOrUpdateNotification(req, notification,true);
                };
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
    usersLikePost: async (
        req, 
        receiveIdUsers,
        acctionUserId, 
        acctionUserName,
        postId, 
        postContent)=>{
            try{
                if(postContent.length>100){postContent=postContent.substring(0,100);}
                for(let e in receiveIdUsers){
                    let notification = new NotificationModel.getNotificationAsObject();
                    notification.ReceiveUser = receiveIdUsers[e];
                    notification.CreatedAt = Date.now();
                    notification.TypeCode = NotificationContant.TypeNotification.Post.UsersLikePost.Code;
                    notification.Key = NotificationContant.generatesKey(notification.TypeCode,postId);
                    notification.Direction = NotificationContant.DirectLink.Post.Details(postId);
                    // notification.Subjects = [NotificationModel.getNotificationObjectAsObject(acctionUserId,acctionUserName,NotificationContant.TypeObject.Account)];
                    // notification.SubjectCount = 1;
                    notification.MainObject = NotificationModel.getNotificationObjectAsObject(postId,postContent,NotificationContant.TypeObject.Post);
                    //add
                    let res = await NotificationController.createOrUpdateNotification(req, notification,false);
                };
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
    usersCommentPost: async (
        req, 
        receiveIdUsers,
        acctionUserId, 
        acctionUserName,
        postId, 
        postContent)=>{
            try{
                if(postContent.length>100){postContent=postContent.substring(0,100);}

                for(let e in receiveIdUsers){
                    let notification = new NotificationModel.getNotificationAsObject();
                    notification.ReceiveUser = receiveIdUsers[e];
                    notification.CreatedAt = Date.now();
                    notification.TypeCode = NotificationContant.TypeNotification.Post.UsersCommentPost.Code;
                    notification.Key = NotificationContant.generatesKey(notification.TypeCode,postId);
                    notification.Direction = NotificationContant.DirectLink.Post.Details(postId);
                    // notification.Subjects = [NotificationModel.getNotificationObjectAsObject(acctionUserId,acctionUserName,NotificationContant.TypeObject.Account)];
                    // notification.SubjectCount = 1;
                    notification.MainObject = NotificationModel.getNotificationObjectAsObject(postId,postContent,NotificationContant.TypeObject.Post);
                    //add
                    let res = await NotificationController.createOrUpdateNotification(req, notification,false);
                };
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    }
}



const ToolsOfNotification = {
    GroupChat:GroupChat,
    Friend:Friend,
    TeamRequest:TeamRequest,
    Team:Team,
    Project:Project,
    Post:Post,

}
module.exports = ToolsOfNotification;