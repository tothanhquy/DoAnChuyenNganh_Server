const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var ChanelChatModel = require('../models/ChanelChatModel');  
var ChanelChatSocket = require('../controllers/Socket/ChanelChatSocket');  
var AccountModel = require('../models/AccountModel');
var Controller = require('./Controller');
const ChanelChatResponse = require("../client_data_response_models/ChanelChat");
const NotificationTool = require("./Tool/Notification");
const Path = require('path');
const fs = require('fs');

//containt the function with business logics  
var ChanelChatController = { 

    //http post, authen
    CreateGroup : async function(req,res){  
        try {  
            let idAccount = req.user.id;

            let name = req.body.name||"";

            //valid
            let resAction = await AccountModel.getDataById(idAccount,req.lang);
            let accountOwn = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            //create group chanel chat
            let nameValid = ChanelChatModel.isValidName(name, req.lang);
            if (!nameValid.isValid) {
                res.json(Controller.Fail(nameValid.error));
                return;
            }
            const chanelChatModel = {  
                Name: name,
                Type: ChanelChatModel.ChanelChatType.Group.toString(),
                Image: "",
                Members: [accountOwn._id],
                GroupOwner: accountOwn._id,
            };   
            resAction = await ChanelChatModel.createGroupChanelChat(chanelChatModel,req.lang); 
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            } else {
                let newChanelChatId = new ChanelChatResponse.ChanelChatsItem(
                    'group',
                    resAction.data.newChanelChat._id,
                    resAction.data.newChanelChat.Name,
                    resAction.data.newChanelChat.Image,
                    resAction.data.newChanelChat.LastTimeAction,
                    0,
                    null,
                    0
                    );
                res.json(Controller.Success({ newChanelChat: newChanelChatId }));
                return;
            }
            
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http get, authen
    GetChanelChatsOfUser: async (req,res) => {
        try {
            let idAccount = req.user.id;

            //get friends of account
            let resAction = await AccountModel.getDataById(idAccount,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let myfriends = resAction.data.Friends.map((e)=>e.User.toString());

            resAction = await ChanelChatModel.getChanelChatsOfUser(idAccount, req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let chanelChats = resAction.data;
            let resChanelChats = [];
            chanelChats.forEach((e)=>{
                let indexInUsersSeen = e.LastTimeMemberSeen.findIndex((us)=>us.User.toString()==idAccount);
                let numberOfNewMessages = indexInUsersSeen==-1?0:e.LastTimeMemberSeen[indexInUsersSeen].Number;
                if(e.Type==ChanelChatModel.ChanelChatType.Friend){
                    let friend = e.Members[0]._id.toString()==idAccount?e.Members[1]:e.Members[0];
                    if(myfriends.indexOf(friend._id.toString())==-1){
                        //unfriend
                        resChanelChats.push(
                            new ChanelChatResponse.ChanelChatsItem(
                                'friend', e._id, "-Undefined Person-","",e.LastTimeAction,e.LastMessage!=null?e.LastMessage.Time:0,e.LastMessage!=null?e.LastMessage.Content:"",numberOfNewMessages
                            ));
                    }else{
                        resChanelChats.push(
                            new ChanelChatResponse.ChanelChatsItem(
                                'friend', e._id, friend.Name ,friend.Avatar,e.LastTimeAction,e.LastMessage!=null?e.LastMessage.Time:0,e.LastMessage!=null?e.LastMessage.Content:"",numberOfNewMessages
                            ));
                    }
                    
                }else if(e.Type==ChanelChatModel.ChanelChatType.Group){
                    resChanelChats.push(
                        new ChanelChatResponse.ChanelChatsItem(
                            'group', e._id, e.Name, e.Image,e.LastTimeAction, e.LastMessage!=null?e.LastMessage.Time:0,e.LastMessage!=null?e.LastMessage.Content:"",numberOfNewMessages
                        ));
                }else {
                    //team
                    resChanelChats.push(
                        new ChanelChatResponse.ChanelChatsItem(
                            'team', e._id, e.Team.Name, e.Team.Avatar,e.LastTimeAction, e.LastMessage!=null?e.LastMessage.Time:0,e.LastMessage!=null?e.LastMessage.Content:"",numberOfNewMessages
                        ));
                }
            });
            resChanelChats.sort((a,b)=>b.lastTimeAction-a.lastTimeAction);
            res.json(Controller.Success({ chanelChats: resChanelChats }));  
        }  
        catch (error) {  
            console.log(error)
            res.json(Controller.Fail(Message(req.lang, "system_error")));  
        }  
    },
    //http get, auth
    Details: async (req, res) => { 
        try {
            let idAccount = req.user.id;
            let idChanelChat = req.query.id_chanel_chat;

            if (idChanelChat == undefined || idChanelChat == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            //check account in members
            let resAction = await ChanelChatModel.getDataByIdPopulateMembers(idChanelChat,req.lang);
            let queryChanelChat = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            if(!isMemberOfChanelChat(idAccount,queryChanelChat.Members)){
                //not a member of group
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }

            //get friends of account
            resAction = await AccountModel.getDataById(idAccount,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let myfriends = resAction.data.Friends.map((e)=>e.User.toString());

            //let isGroupOwner = queryChanelChat.GroupOwner==null||queryChanelChat.GroupOwner.toString()!=idAccount?false:true;
            let members = queryChanelChat.Members.map((e)=>new ChanelChatResponse.ChanelChatMember(e._id,e.Name,e.Avatar));
            let lastTimeMemberSeen = queryChanelChat.LastTimeMemberSeen.map((e)=>new ChanelChatResponse.LastTimeMemberSeen(e.User,e.Message));
            let resChanelChat = new ChanelChatResponse.ChanelChatDetails();
            resChanelChat.members = members;
            resChanelChat.lastTimeMemberSeen = lastTimeMemberSeen;
            resChanelChat.id = queryChanelChat._id;
            resChanelChat.accountId = idAccount;

            if(queryChanelChat.Type==ChanelChatModel.ChanelChatType.Friend){
                let friend = queryChanelChat.Members[0]._id.toString()==idAccount?queryChanelChat.Members[1]:queryChanelChat.Members[0];
                resChanelChat.type = "friend";
                
                if(myfriends.indexOf(friend._id.toString())==-1){
                    //unfriend
                    resChanelChat.name = "-Undefined Person-";
                    resChanelChat.avatar = "";
                    resChanelChat.friendId = null;
                }else{
                    resChanelChat.name = friend.Name;
                    resChanelChat.avatar = friend.Avatar;
                    resChanelChat.friendId = friend._id;
                }
                
            }else if(queryChanelChat.Type==ChanelChatModel.ChanelChatType.Group){
                resChanelChat.type = "group";
                resChanelChat.name = queryChanelChat.Name;
                resChanelChat.avatar = queryChanelChat.Image;
                resChanelChat.isGroupOwner=queryChanelChat.GroupOwner.toString()!=idAccount?false:true;
    
            }else {
                //team
                resChanelChat.type = "team";
                resChanelChat.teamId = queryChanelChat.Team._id;
                resChanelChat.name = queryChanelChat.Team.Name;
                resChanelChat.avatar = queryChanelChat.Team.Avatar;
    
            }
            res.json(Controller.Success({resChanelChat}));  
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http post, authen
    EditGroupChatName: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idChanelChat = req.body.id_chanel_chat;
            let newName = req.body.new_name;

            let nameValid = ChanelChatModel.isValidName(newName, req.lang);
            if (!nameValid.isValid) {
                res.json(Controller.Fail(nameValid.error));
                return;
            }

            if (idChanelChat == undefined || idChanelChat == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await ChanelChatModel.getDataByIdPopulateGroupOwner(idChanelChat,req.lang);
            let editChanelChat = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            //check type chanel chat
            if(editChanelChat.Type!==ChanelChatModel.ChanelChatType.Group){
                //only group 
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }

            if(editChanelChat.Members.indexOf(idAccount)==-1){
                //not a member of group
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }
            //notification receive users
            let notificationReceiveUsers=[];
            notificationReceiveUsers=editChanelChat.Members.map(e=>e.toString());
            notificationReceiveUsers=notificationReceiveUsers.filter(e=>e!=idAccount);
            let oldName = editChanelChat.Name;

            editChanelChat.Name = newName;
            editChanelChat.LastTimeAction = Date.now();
            //update
            let updateFields = {$set:{Name:editChanelChat.Name,LastTimeAction:editChanelChat.LastTimeAction}};
            resAction = await ChanelChatModel.updateChanelChat(editChanelChat._id, updateFields,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                NotificationTool.changeNameGroupChat(req,
                    notificationReceiveUsers,
                    editChanelChat.GroupOwner._id.toString(),
                    editChanelChat.GroupOwner.Name,
                    oldName,
                    editChanelChat._id.toString(),
                    newName)

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
    EditGroupChatImage: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idChanelChat = req.body.id_chanel_chat;

            if (idChanelChat == undefined || idChanelChat == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await ChanelChatModel.getDataById(idChanelChat,req.lang);
            let editChanelChat = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            //check type chanel chat
            if(editChanelChat.Type!==ChanelChatModel.ChanelChatType.Group){
                //only group 
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }

            if(editChanelChat.Members.indexOf(idAccount)==-1){
                //not a member of group
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }
            
            //must upload image
            if (!req.files || !req.files.avatar) {
                res.json(Controller.Fail(Message(req.lang,'must_upload_file_image')));
                return; 
            } else if (req.files.avatar.size > Controller.Constant.GROUP_CHAT_AVATAR_FILE_LIMIT_KB*1024) {
                res.json(Controller.Fail(Message(req.lang,'image_file_limit_size_kb').replace('{{size}}',Controller.Constant.GROUP_CHAT_AVATAR_FILE_LIMIT_KB )));
                return; 
            } else {
                let image = req.files.avatar;
                console.log(image.mimetype)
                let fullPath = Path.join(__dirname,'..','public','images','group_chat_avatar');
                if (!image.mimetype.startsWith('image/')) {
                    res.json(Controller.Fail(Message(req.lang,'file_only_image')));
                    return; 
                } else {
                    //delete old
                    if (editChanelChat.Image!=null&&editChanelChat.Image!=""&&Controller.isExistPath(Path.join(fullPath, editChanelChat.Image))) {
                        if (!Controller.deleteFile(Path.join(fullPath, editChanelChat.Image))) {
                            res.json(Controller.Fail(Message(req.lang,'error_with_save_file')));
                            return; 
                        }
                    }
                    
                    let avatarPath = idChanelChat +"."+ image.name;
                    image.mv(Path.join(fullPath, avatarPath));
                    editChanelChat.Image = avatarPath;

                    editChanelChat.LastTimeAction = Date.now();
                    //update
                    let updateFields = {$set:{Image:editChanelChat.Image,LastTimeAction:editChanelChat.LastTimeAction}};
                    resAction = await ChanelChatModel.updateChanelChat(editChanelChat._id, updateFields,req.lang);
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
    //http post, authen
    DeleteMemberOfGroup: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idChanelChat = req.body.id_chanel_chat;
            let idMember = req.body.id_member;

            if (idChanelChat == undefined || idChanelChat == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await ChanelChatModel.getDataById(idChanelChat,req.lang);
            let editChanelChat = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            //check type chanel chat
            if(editChanelChat.Type!==ChanelChatModel.ChanelChatType.Group){
                //only group 
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }

            if (editChanelChat.GroupOwner.toString() != idAccount) {
                //not group owner
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }

            let memberDeleteIndex = editChanelChat.Members.indexOf(idMember);

            if (idAccount == idMember||memberDeleteIndex==-1) {
                res.json(Controller.Fail(Message(req.lang, 'member_unvalid')));
                return; 
            }

            //delete member
            editChanelChat.Members.splice(memberDeleteIndex, 1);
            editChanelChat.LastTimeAction = Date.now();
            //update
            let updateFields = {$set:{Members:editChanelChat.Members,LastTimeAction:editChanelChat.LastTimeAction}};
            resAction = await ChanelChatModel.updateChanelChat(editChanelChat._id, updateFields,req.lang);
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
    //http get, auth
    GetMembers: async (req, res) => { 
        try {
            let idAccount = req.user.id;

            let idChanelChat = req.query.id_chanel_chat;

            let resAction = await ChanelChatModel.getDataById(idChanelChat,req.lang);
            let queryChanelChat = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            //check type chanel chat
            if(queryChanelChat.Type!==ChanelChatModel.ChanelChatType.Group){
                //only group
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }
            //check is member
            if(queryChanelChat.Members.indexOf(idAccount)==-1){
                //not group member
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }

            queryChanelChat = await queryChanelChat.populate(
                {
                    path: 'Members',
                    select: '_id Name Avatar'
                });

            let resObject = new ChanelChatResponse.ChanelChatMemberList();
            resObject.accountId = idAccount;
            resObject.type = queryChanelChat.Type;
            //get members
            let members = [];

            queryChanelChat.Members.forEach(member => {
                members.push(
                    new ChanelChatResponse.ChanelChatMember(
                        member._id,
                        member.Name,
                        member.Avatar,
                    )
                );
            });
            resObject.members = members;
            if(queryChanelChat.GroupOwner.toString()==idAccount){
                resObject.isGroupOwner = true;
            }

            res.json(Controller.Success(resObject));  
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http post, authen
    ExitGroupChat: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let idChanelChat = req.body.id_chanel_chat;
            let idNewGroupOwner = req.body.id_new_group_owner;

            if (idChanelChat == undefined || idChanelChat == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await ChanelChatModel.getDataById(idChanelChat,req.lang);
            let editChanelChat = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            //check type chanel chat
            if(editChanelChat.Type!==ChanelChatModel.ChanelChatType.Group){
                //only group 
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }

            if (editChanelChat.GroupOwner.toString() != idAccount) {
                //not group owner
                let memberExistIndex = editChanelChat.Members.indexOf(idAccount);

                if (memberExistIndex == -1) {
                    //is not member
                    res.json(Controller.Fail(Message(req.lang, 'is_not_member')));
                    return; 
                }

                editChanelChat.Members.splice(memberExistIndex, 1);
            } else {
                //is group owner
                if(editChanelChat.Members.length==1){
                    //delete chanel chat
                    resAction = await ChanelChatModel.delete(editChanelChat._id,req.lang);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(resAction.error));   
                        return;
                    } else {
                        res.json(Controller.Success({ isComplete:true }));  
                        return;
                    }
                    //delete messages


                }else{
                    let memberExistIndex = editChanelChat.Members.indexOf(idNewGroupOwner);

                    if (idAccount == idNewGroupOwner||memberExistIndex==-1) {
                        res.json(Controller.Fail(Message(req.lang, 'new_group_owner_unvalid')));
                        return; 
                    }
                    //update new leader
                    editChanelChat.GroupOwner = idNewGroupOwner;
    
                    //exit member
                    let memberExitIndex = editChanelChat.Members.indexOf(idAccount);
                    if(memberExitIndex!=-1)editChanelChat.Members.splice(memberExitIndex, 1);
                }

            }
            
            editChanelChat.LastTimeAction = Date.now();
            //update
            let updateFields = {$set:{Members:editChanelChat.Members, GroupOwner:editChanelChat.GroupOwner,LastTimeAction:editChanelChat.LastTimeAction}};
            
            resAction = await ChanelChatModel.updateChanelChat(editChanelChat._id, updateFields,req.lang);
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
    //http post, auth
    InsertMembers: async (req,res) => {
        try {
            let idAccount = req.user.id;
            let id_members = JSON.parse(req.body.members)||[];
            let idChanelChat = req.body.id_chanel_chat;

            if (idChanelChat == undefined || idChanelChat == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            //check account in members
            let resAction = await ChanelChatModel.getDataByIdPopulateGroupOwner(idChanelChat,req.lang);
            let editChanelChat = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            //check type chanel chat
            if(editChanelChat.Type!==ChanelChatModel.ChanelChatType.Group){
                //only group 
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }
            
            if(editChanelChat.Members.indexOf(idAccount)==-1){
                //not a member of group
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }

            if (!Controller.isStringArray(id_members)) {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            //check friends
            resAction = await AccountModel.getDataById(idAccount,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let friends = resAction.data.Friends;
            id_members = id_members.filter((e)=>friends.findIndex((a)=>a.User.toString()==e)!=-1);
            
            if(id_members.length==0){
                //empty
                res.json(Controller.Success({ isComplete: true }));  
                return;
            }

            //notification receive users
            let notificationReceiveUsers=[];
            //push
            id_members.forEach((new_member)=>{
                if(editChanelChat.Members.indexOf(new_member)==-1){
                    editChanelChat.Members.push(new_member);
                    notificationReceiveUsers.push(new_member);
                }
            });

            editChanelChat.LastTimeAction = Date.now();
            //update
            let updateFields = {$set:{Members:editChanelChat.Members,LastTimeAction:editChanelChat.LastTimeAction}};
            
            resAction = await ChanelChatModel.updateChanelChat(editChanelChat._id, updateFields,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            } else {
                NotificationTool.insertUsersToGroupChat(
                    req,
                    notificationReceiveUsers,
                    editChanelChat.GroupOwner._id,
                    editChanelChat.GroupOwner.Name,
                    editChanelChat._id,
                    editChanelChat.Name);

                res.json(Controller.Success({ isComplete: true }));  
                return;
            }
          
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));
        }  
    },
    //not http. is tool for other controller 
    //return list of id chanel chats. error is []
    getIdChanelChatsOfUser: async (idUser) => {
        try {
            let idAccount = idUser;

            let resAction = await ChanelChatModel.getChanelChatsOfUser(idAccount, "default");
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                return [];
            }
            let chanelChats = resAction.data;
            let resIdChanelChats = [];
            chanelChats.forEach((e)=>{
                resIdChanelChats.push(e._id);
            });
            return resIdChanelChats;
        }  
        catch (error) {  
            console.log(error)
            return [];
        }  
    },
    //not http. is tool for other controller 
    //return true or false
    updateMembersOfTeamChanelChat: async (idChanelChat) => {
        try {
            if (idChanelChat == undefined || idChanelChat == "") {
                return false; 
            }

            let resAction = await ChanelChatModel.getDataById(idChanelChat,"default");
            let queryChanelChat = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                return false;
            }
            if(!queryChanelChat.Type==ChanelChatModel.ChanelChatType.Team){
                //not a team chanel chat
                return true;
            }
            let membersOfTeam = queryChanelChat.Team.Members||[];
            queryChanelChat.Members = membersOfTeam;

            queryChanelChat.LastTimeAction = Date.now();
            //update
            let updateFields = {$set:{Members:queryChanelChat.Members,LastTimeAction:queryChanelChat.LastTimeAction}};
            
            resAction = await ChanelChatModel.updateChanelChat(queryChanelChat._id, updateFields,"default");
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                return false;
            } else {
                return true;
            }
        }  
        catch (error) {  
            console.log(error);
            return false;
        }  
    },
    //not http. is tool for other controller 
    //return true or false
    isMemberOfChanelChat: async (idUser, members) => {
        try {
            let membersId = members.map((e)=>e._id);
            if(membersId.indexOf(idUser)==-1){
                return false;
            }else{
                return true;
            }
        }  
        catch (error) {  
            return false;
        }  
    },
    //not http. is tool for other controller 
    //return true or false
    updateLastMessageOfChanelChat: async (req, idChanelChat, idLastMassage, contentLastMessage, timeLastMessage, idCreator, numberOfNewMessages) => {
        try {
            if (idChanelChat == undefined || idChanelChat == "") {
                return false; 
            }

            let resAction = await ChanelChatModel.getDataById(idChanelChat,req.lang);
            let queryChanelChat = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                return false;
            }
            if(queryChanelChat.Members.indexOf(idCreator)==-1){
                //not a member of chanel chat
                return false;
            }
            
            queryChanelChat.LastMessage = idLastMassage;
            
            let notifiLastNewMessagesSocket=[];
            let notifiHasNewChanelChat=[];

            queryChanelChat.Members.forEach((e)=>{
                let ind = queryChanelChat.LastTimeMemberSeen.findIndex((l)=>l.User==e.toString());
                if(ind==-1){
                    //new
                    queryChanelChat.LastTimeMemberSeen.push({
                        User:e,
                        Message: null,
                        Number: e==idCreator?0:numberOfNewMessages,
                    });
                    ind = queryChanelChat.LastTimeMemberSeen.length-1;
                    notifiHasNewChanelChat.push(e.toString());
                }else{
                    if(e==idCreator){
                        queryChanelChat.LastTimeMemberSeen[ind].Number = 0;
                        queryChanelChat.LastTimeMemberSeen[ind].Message = idLastMassage;
                    }else{
                        queryChanelChat.LastTimeMemberSeen[ind].Number+=numberOfNewMessages;
                    }
                }
                // if(queryChanelChat.LastTimeMemberSeen[ind].Number!=0){
                    notifiLastNewMessagesSocket.push(new ChanelChatResponse.LastNewMessageSocket(
                        contentLastMessage,
                        timeLastMessage,
                        idChanelChat,
                        e.toString(),
                        queryChanelChat.LastTimeMemberSeen[ind].Number
                    ));
                // }
            });

            queryChanelChat.LastTimeAction = Date.now();
            //update
            let updateFields = {$set:{LastMessage:queryChanelChat.LastMessage,LastTimeMemberSeen:queryChanelChat.LastTimeMemberSeen,LastTimeAction:queryChanelChat.LastTimeAction}};
            resAction = await ChanelChatModel.updateChanelChat(queryChanelChat._id, updateFields,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                return false;
            } else {
                //send socket
                ChanelChatSocket.notifiLastMessageForMembers(req.io, notifiLastNewMessagesSocket);
                ChanelChatSocket.notifiHasNewChanelForNewMembers(req.io, notifiHasNewChanelChat);


                return true;
            }
        }  
        catch (error) {  
            console.log(error)
            return false;
        }  
    },
    //http post, auth
    UserSeen: async (req,res) => {
        try {
            let idAccount = req.user.id;
            let idChanelChat = req.body.id_chanel_chat;

            if (idChanelChat == undefined || idChanelChat == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            //check account in members
            let resAction = await ChanelChatModel.getDataById(idChanelChat,req.lang);
            let editChanelChat = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            if(editChanelChat.Members.indexOf(idAccount)==-1){
                //not a member of group
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }

            let ind = editChanelChat.LastTimeMemberSeen.findIndex((l)=>l.User==idAccount);
            if(ind==-1){
                //do not thing
                res.json(Controller.Success({ isComplete: true }));  
                return;
            }else{
                if(editChanelChat.LastTimeMemberSeen[ind].Message==null||editChanelChat.LastTimeMemberSeen[ind].Message.toString()!=editChanelChat.LastMessage._id.toString()){
                    editChanelChat.LastTimeMemberSeen[ind].Number = 0;
                    editChanelChat.LastTimeMemberSeen[ind].Message = editChanelChat.LastMessage;
                
                    //update
                    let updateFields = {$set:{LastTimeMemberSeen:editChanelChat.LastTimeMemberSeen}};
                    resAction = await ChanelChatModel.updateChanelChat(editChanelChat._id, updateFields,req.lang);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(resAction.error));   
                        return;
                    } else {
                        //send socket
                        ChanelChatSocket.notifiUserSeen(req.io, idChanelChat, idAccount, editChanelChat.LastMessage._id.toString());
    
                        res.json(Controller.Success({ isComplete: true }));  
                        return;
                    }
                }else{
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
}  
const isMemberOfChanelChat = ChanelChatController.isMemberOfChanelChat
module.exports = ChanelChatController;