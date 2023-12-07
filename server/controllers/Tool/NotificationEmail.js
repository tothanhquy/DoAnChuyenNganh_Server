const NotificationMessages = require("../../notification_email_constants/MessageNotification/Messages");
const NotificationMessagesName = require("../../notification_email_constants/TypeNotification");
const AccountModel = require('../../models/AccountModel');
const Mail = require('../../core/Mail');
const ModelResponse = require('../../models/ModelResponse');


const ReceiveEmailType = {
    AddFriend:"addFriend",
    TeamRecruit:"teamRecruit",
    TeamJoin:"teamJoin",
    ProjectInvite:"projectInvite",
}

//null is not send
const getEmail = async (lang,idReceiveUser,type)=>{
    try{
        let resAction = await AccountModel.getDataById(idReceiveUser,lang);
        let account = resAction.data;
        if (resAction.status == ModelResponse.ResStatus.Fail) {
            return null;
        } else {
            if (account.IsVerifyEmail == false) {
                return null;
            }
            let registerReceiveEmail = account.RegisterReceiveEmail;
            console.log(registerReceiveEmail);
            if(registerReceiveEmail==null||registerReceiveEmail==undefined){
                return null;
            }
            if(type==ReceiveEmailType.AddFriend){
                return registerReceiveEmail.AddFriendRequest===true? account.Email:null;
            }
            if(type==ReceiveEmailType.TeamRecruit){
                return registerReceiveEmail.TeamRecruitRequest===true? account.Email:null;
            }
            if(type==ReceiveEmailType.TeamJoin){
                return registerReceiveEmail.TeamJoinRequest===true? account.Email:null;
            }
            if(type==ReceiveEmailType.ProjectInvite){
                return registerReceiveEmail.ProjectInviteRequest===true? account.Email:null;
            }
            return null;
        }
    }catch(err){
        console.log(err)
        return null;
    }
}
const tool = {
    sendAddFriendRequest: async(lang,idReceiveUser,sendUserName,content)=>{
        try{
            let email = await getEmail(lang,idReceiveUser,ReceiveEmailType.AddFriend);
            console.log("email:"+email);
            if(email!==null){
                let emailContent = NotificationMessages(lang, NotificationMessagesName.Friend.SendYouFriendRequest);
                emailContent = emailContent
                    .replace('{{ActionUserName}}', sendUserName)
                    .replace('{{Content}}', content);
            
                if (await Mail.Send(email, NotificationMessages(lang, 'default_title'), emailContent)) {
                    console.log("sendAddFriendRequest");
                    return true;
                } else {
                    console.log("sendAddFriendRequest:false");
                    return false;
                }
            }
        }catch(err){
            console.log(err);
        }
    },
    sendTeamRecruitRequest: async(lang,idReceiveUser,sendUserName,teamName,title,content)=>{
        try{
            let email = await getEmail(lang,idReceiveUser,ReceiveEmailType.TeamRecruit);
            console.log("email:"+email);
            if(email!==null){
                let userContent = title+"\n"+content;
                let emailContent = NotificationMessages(lang, NotificationMessagesName.TeamRequest.SendYouTeamRecruitRequest);
                emailContent = emailContent
                    .replace('{{ActionUserName}}', sendUserName)
                    .replace('{{Content}}', userContent)
                    .replace('{{TeamName}}', teamName);
            
                if (await Mail.Send(email, NotificationMessages(lang, 'default_title'), emailContent)) {
                    console.log("sendTeamRecruitRequest");
                    return true;
                } else {
                    console.log("sendTeamRecruitRequest:false");
                    return false;
                }
            }
        }catch(err){
            console.log(err);
        }
    },
    sendTeamJoinRequest: async(lang,idReceiveUser,sendUserName,teamName,title,content)=>{
        try{
            let email = await getEmail(lang,idReceiveUser,ReceiveEmailType.TeamJoin);
            console.log("email:"+email);
            if(email!==null){
                let userContent = title+"\n"+content;
                let emailContent = NotificationMessages(lang, NotificationMessagesName.TeamRequest.SendYouTeamJoinRequest);
                emailContent = emailContent
                    .replace('{{ActionUserName}}', sendUserName)
                    .replace('{{Content}}', userContent)
                    .replace('{{TeamName}}', teamName);
            
                if (await Mail.Send(email, NotificationMessages(lang, 'default_title'), emailContent)) {
                    console.log("sendTeamJoinRequest");
                    return true;
                } else {
                    console.log("sendTeamJoinRequest:false");
                    return false;
                }
            }
        }catch(err){
            console.log(err);
        }
    },
    sendProjectInviteRequest: async(lang,idReceiveUser,sendUserName,projectName)=>{
        try{
            let email = await getEmail(lang,idReceiveUser,ReceiveEmailType.ProjectInvite);
            console.log("email:"+email);
            if(email!==null){
                let emailContent = NotificationMessages(lang, NotificationMessagesName.Project.SendYouInvitingRequest);
                emailContent = emailContent
                    .replace('{{ActionUserName}}', sendUserName)
                    .replace('{{ProjectName}}', projectName);
            
                if (await Mail.Send(email, NotificationMessages(lang, 'default_title'), emailContent)) {
                    console.log("sendProjectInviteRequest");
                    return true;
                } else {
                    console.log("sendProjectInviteRequest:false");
                    return false;
                }
            }
        }catch(err){
            console.log(err);
        }
    }
    
}
module.exports = tool;
