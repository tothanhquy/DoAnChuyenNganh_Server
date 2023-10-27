const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var ChanelChatModel = require('../models/ChanelChatModel');  
var AccountModel = require('../models/AccountModel');  
var ChanelChatModel = require('../models/ChanelChatModel');  
var Controller = require('./Controller');
const ChanelChatResponse = require("../client_data_response_models/ChanelChat");

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
                LastTime: 0,
            };   
            resAction = await ChanelChatModel.createGroupChanelChat(chanelChatModel,req.lang); 
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            } else {
                let newChanelChatId = resAction.data.id;
                res.json(Controller.Success({ id: newChanelChatId }));
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
            let chanelChats = resAction.data.filter(e=> e.Type!==ChanelChatModel.ChanelChatType.Team || e.Team.Members.indexOf(idAccount)) || [];
            let resChanelChats = [];
            chanelChats.forEach((e)=>{
                if(e.Type==ChanelChatModel.ChanelChatType.Friend){
                    let friend = e.Members[0]._id.toString()==idAccount?e.Members[1]:e.Members[0];
                    if(myfriends.indexOf(friend._id)==-1){
                        //unfriend
                        resChanelChats.push(
                            new ChanelChatResponse.ChanelChatsItem(
                                ChanelChatModel.ChanelChatType.Friend, e._id, "-Undefined Person-","",e.LastTime,e.LastMessage
                            ));
                    }else{
                        resChanelChats.push(
                            new ChanelChatResponse.ChanelChatsItem(
                                ChanelChatModel.ChanelChatType.Friend, e._id, friend.Name ,friend.Avatar,e.LastTime,e.LastMessage
                            ));
                    }
                    
                }else if(e.Type==ChanelChatModel.ChanelChatType.Group){
                    resChanelChats.push(
                        new ChanelChatResponse.ChanelChatsItem(
                            ChanelChatModel.ChanelChatType.Group, e._id, e.Name, e.Image, e.LastTime, e.LastMessage
                        ));
                }else {
                    //team
                    resChanelChats.push(
                        new ChanelChatResponse.ChanelChatsItem(
                            ChanelChatModel.ChanelChatType.Team, e._id, e.Team.Name, e.Team.Avatar, e.LastTime, e.LastMessage
                        ));
                }
            });
            resChanelChats.sort((a,b)=>b.lastTime-a.lastTime);
            res.json(Controller.Success({ chanelChats: resChanelChats }));  
        }  
        catch (error) {  
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
            let resAction = await ChanelChatModel.getDataById(idChanelChat,req.lang);
            let queryChanelChat = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            if(queryChanelChat.Members.indexOf(idAccount)==-1){
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

            let isGroupOwner = queryChanelChat.GroupOwner==null||queryChanelChat.GroupOwner.toString()!=idAccount?false:true;

            let resChanelChat;

            if(queryChanelChat.Type==ChanelChatModel.ChanelChatType.Friend){
                let friend = queryChanelChat.Members[0]._id.toString()==idAccount?queryChanelChat.Members[1]:queryChanelChat.Members[0];
                if(myfriends.indexOf(friend._id)==-1){
                    //unfriend
                    resChanelChat=
                        new ChanelChatResponse.ChanelChatDetails(
                            ChanelChatModel.ChanelChatType.Friend, queryChanelChat._id, "-Undefined Person-","",queryChanelChat.LastTime,queryChanelChat.LastMessage
                        );
                }else{
                    resChanelChat=
                        new ChanelChatResponse.ChanelChatDetails(
                            ChanelChatModel.ChanelChatType.Friend, queryChanelChat._id, friend.Name ,friend.Avatar,queryChanelChat.LastTime,queryChanelChat.LastMessage
                        );
                }
                
            }else if(queryChanelChat.Type==ChanelChatModel.ChanelChatType.Group){
                resChanelChat=
                    new ChanelChatResponse.ChanelChatDetails(
                        ChanelChatModel.ChanelChatType.Group, queryChanelChat._id, queryChanelChat.Name, queryChanelChat.Image, queryChanelChat.LastTime, queryChanelChat.LastMessage, isGroupOwner
                    );
            }else {
                //team
                resChanelChat=
                    new ChanelChatResponse.ChanelChatDetails(
                        ChanelChatModel.ChanelChatType.Team, queryChanelChat._id, queryChanelChat.Team.Name, queryChanelChat.Team.Avatar, queryChanelChat.LastTime, queryChanelChat.LastMessage
                    );
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
            
            editChanelChat.Name = newName;
            //update
            resAction = await ChanelChatModel.updateChanelChat(editChanelChat._id, editChanelChat,req.lang);
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

                    //update
                    resAction = await ChanelChatModel.updateChanelChat(editChanelChat._id, editChanelChat,req.lang);
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
            
            //update
            resAction = await ChanelChatModel.updateChanelChat(idChanelChat, editChanelChat,req.lang);
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

            let idChanelChat = req.body.id_chanel_chat;

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
                    editChanelChat.Leader = idNewGroupOwner;
    
                    //exit member
                    let memberExitIndex = editChanelChat.Members.indexOf(idAccount);
                    if(memberExitIndex!=-1)editChanelChat.Members.splice(memberExitIndex, 1);
                }

            }
            
            //update
            resAction = await ChanelChatModel.updateChanelChat(editChanelChat._id, editChanelChat,req.lang);
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

            //push
            id_members.forEach((new_member)=>{
                if(editChanelChat.Members.indexOf(new_member)==-1){
                    editChanelChat.Members.push(new_member);
                }
            });

            //update
            resAction = await ChanelChatModel.updateChanelChat(editChanelChat._id, editChanelChat,req.lang);
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
}  

module.exports = ChanelChatController;