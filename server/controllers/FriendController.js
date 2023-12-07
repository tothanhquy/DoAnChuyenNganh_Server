const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
const FriendModelResponse = require('../client_data_response_models/Friend');
var AccountModel = require('../models/AccountModel');  
var ChanelChatModel = require('../models/ChanelChatModel');  
var FriendRequestModel = require('../models/FriendRequestModel');  
var Controller = require('./Controller');
const NotificationTool = require("./Tool/Notification");
const NotificationEmailTool = require("./Tool/NotificationEmail");

const GET_LIST_LIMIT_REQUESTS = 20;

//containt the function with business logics  
var FriendController = { 

    //http get, auth
    GetFriendsOfUser: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let friends = [];

            let resAction = await AccountModel.getDataById(idAccount,req.lang);
            let account = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            account = await account.populate(
                {
                    path: 'Friends.User',
                    select: '_id Name Avatar'
                });
            
            friends = account.Friends.map(a=> new FriendModelResponse.FriendListItem(a.User._id,a.User.Name,a.User.Avatar));
            
            res.json(Controller.Success({ friends:friends }));  
        }  
        catch (error) {  
            console.log(error)
            res.json(Controller.Fail(Message(req.lang, "system_error")));  
        }  
    },
    //http post, authen
    Create : async function(req,res){  
        try {
            let idAccount = req.user.id;
            let nameAccount = req.user.userData.name;

            let userReceiveId = req.body.user_receive_id;
            let content = req.body.content;

            //valid
            let contentValid = FriendRequestModel.isValidContent(content, req.lang);
            if (!contentValid.isValid) {
                res.json(Controller.Fail(contentValid.error));
                return;
            }

            if(idAccount == userReceiveId){
                res.json(Controller.Fail(Message(req.lang,"user_receive_unvalid")));
                return;
            }

            //check exit receive user
            let resAction = await AccountModel.getDataById(userReceiveId,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(Message(req.lang,"user_receive_unvalid")));
                return;
            }
            let receiveUser = resAction.data;

            //check friend list
            resAction = await AccountModel.getDataById(idAccount,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(Message(req.lang,"system_error")));
                return;
            }
            let friends = resAction.data.Friends;
            let sendUser = resAction.data;
            if(friends.findIndex((e)=>e.User.toString()==userReceiveId)!=-1){
                res.json(Controller.Fail(Message(req.lang,"user_receive_was_friend")));
                return;
            }

            //check request exist
            resAction = await FriendRequestModel.checkAndGetRequestByUser(idAccount,userReceiveId,req.lang);
            let friendRequest = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            if(friendRequest === null){
                //empty
                //create request
                const requestModel = {
                    Content: content,
                    SendUser: idAccount,
                    ReceiveUser: receiveUser._id,
                    RequestTime: Date.now() 
                };   

                resAction = await FriendRequestModel.createFriendRequest(requestModel,req.lang); 
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return;
                } else {
                    //notification
                    NotificationTool.Friend.sendFriendRequest(
                        req,
                        receiveUser._id.toString(),
                        resAction.data.id,
                        idAccount,
                        nameAccount);
                    
                    NotificationEmailTool.sendAddFriendRequest(req.lang,receiveUser._id.toString(),nameAccount,content);
                    

                    res.json(Controller.Success({ isComplete:true, isFriend: false }));
                    return;
                }
                
            }else if(friendRequest.SendUser.toString() === idAccount){
                //duplicate
                res.json(Controller.Fail(Message(req.lang,"friend_request_was_sent_before")));
                return;
            }else{
                // surely (friendRequest.SendUser === userReceiveId)
                //complete
                //get exist friend chanel
                resAction = await ChanelChatModel.checkAndGetFriendChanelChatOfUser(idAccount,receiveUser._id,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));   
                    return;
                }
                let chanelChatId = resAction.data;
                if(chanelChatId==null){
                    //create chanel chat
                    resAction = await ChanelChatModel.createFriendChanelChat(idAccount,receiveUser._id,req.lang);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(resAction.error));   
                        return;
                    }
                    chanelChatId = resAction.data.id;
                }

                if(receiveUser.Friends.findIndex((e)=> e.User.toString()==idAccount)==-1){
                    //add
                    receiveUser.Friends.push({
                        User: sendUser._id,
                        ChanelChat: chanelChatId,
                    });

                    //update from receive user
                    resAction = await AccountModel.updateAccount(receiveUser._id, receiveUser,req.lang);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(resAction.error));   
                        return;
                    }
                    
                }

                if(sendUser.Friends.findIndex((e)=> e.User.toString()==receiveUser._id)==-1){
                    //add
                    sendUser.Friends.push({
                        User: receiveUser._id,
                        ChanelChat: chanelChatId,
                    });
                
                    //update from send user
                    resAction = await AccountModel.updateAccount(sendUser._id, sendUser,req.lang);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(resAction.error));   
                        return;
                    }
                }

                //notification to friend
                NotificationTool.Friend.becomeFriend(
                    req,
                    receiveUser._id.toString(),
                    sendUser._id.toString(),
                    sendUser.Name);
                //notification to me
                NotificationTool.Friend.becomeFriend(
                    req,
                    sendUser._id.toString(),
                    receiveUser._id.toString(),
                    receiveUser.Name);
                
                //delete old request
                resAction = await FriendRequestModel.delete(req.lang, friendRequest._id);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));   
                    return;
                }else{
                    res.json(Controller.Success({ isComplete: true, isFriend: true }));  
                    return;
                }
            }

        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http get, auth
    GetFriendRequests: async (req,res) => {
        try {
            let idAccount = req.user.id;

            let method = req.query.method;

            let timePrivious = req.query.time;
            if (timePrivious == undefined || timePrivious == 0) timePrivious = Date.now();

            if (method !== "send" && method !== "receive") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }

            let populateUser = {
                path: 'SendUser ReceiveUser',
                select: '_id Name Avatar'
            };

            let condition;
            if(method==="send"){
                condition = {
                    SendUser : idAccount,
                    RequestTime: {$lt:timePrivious}
                }
            }else{
                condition = {
                    ReceiveUser : idAccount,
                    RequestTime: {$lt:timePrivious}
                }
            }

            let resAction = await FriendRequestModel.getRequestsPopulateLimit(condition,populateUser,GET_LIST_LIMIT_REQUESTS+1,req.lang); 
            let queryRequests = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            let isFinish;
            let timePrevious;
            let requests = [];

            if (queryRequests.length == 0) {
                isFinish = true;
                timePrevious = 0;
            } else {
                isFinish = queryRequests.length != GET_LIST_LIMIT_REQUESTS + 1;
                if (!isFinish) queryRequests.splice(GET_LIST_LIMIT_REQUESTS, 1);
                timePrevious = queryRequests[queryRequests.length - 1].RequestTime;
            }

            if(method==="receive"){
                requests = queryRequests.map((a)=> new FriendModelResponse.FriendRequestsItem(a._id,a.SendUser._id,a.SendUser.Name,a.SendUser.Avatar,a.RequestTime));
            }else{
                requests = queryRequests.map((a)=> new FriendModelResponse.FriendRequestsItem(a._id,a.ReceiveUser._id,a.ReceiveUser.Name,a.ReceiveUser.Avatar,a.RequestTime));
            }
            
            res.json(Controller.Success(new FriendModelResponse.FriendRequests(
                timePrevious,
                isFinish,
                requests,
            )));  
        }  
        catch (error) {  
            console.log(error)
            res.json(Controller.Fail(Message(req.lang, "system_error")));  
        }  
    },
    //http get, authen
    Details : async function(req,res){  
        try {  
            let idAccount = req.user.id;

            let requestId = req.query.request_id;
            let method = req.query.method;

            if (method !== "send" && method !== "receive") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }
            
            let populateUser = {
                path: 'SendUser ReceiveUser',
                select: '_id Name Avatar'
            };
            
            let queryRequest = await FriendRequestModel.findOne({ _id: requestId }).populate(populateUser);
            if (queryRequest == null) {
                res.json(Controller.Fail(Message(req.lang,"request_not_exist")));
                return;
            }

            if(method === "send"){
                if (queryRequest.SendUser._id.toString() != idAccount) {
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }
                res.json(Controller.Success(new FriendModelResponse.FriendRequest(queryRequest._id.toString(),queryRequest.Content,queryRequest.ReceiveUser._id.toString(),queryRequest.ReceiveUser.Name,queryRequest.ReceiveUser.Avatar,queryRequest.RequestTime))); 
                return;
            }else{
                if (queryRequest.ReceiveUser._id.toString() != idAccount) {
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }
                res.json(Controller.Success(new FriendModelResponse.FriendRequest(queryRequest._id.toString(),queryRequest.Content,queryRequest.SendUser._id.toString(),queryRequest.SendUser.Name,queryRequest.SendUser.Avatar,queryRequest.RequestTime))); 
                return;
            }
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http post, authen
    Response : async function(req,res){  
        try {  
            let idAccount = req.user.id;

            let requestId = req.body.request_id;
            let method = req.body.method;
            let response = req.body.response;

            if (
                    !(method === "send" && response === "cancel" 
                ) && !(
                    method === "receive" && (response === "agree" || response === "disagree"))
                ) {
                    console.log(1)
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }
            
            let populateUser = {
                path: 'SendUser ReceiveUser',
                select: '_id Name Avatar'
            };
            
            let queryRequest = await FriendRequestModel.findOne({ _id: requestId }).populate(populateUser);
            if (queryRequest == null) {
                res.json(Controller.Fail(Message(req.lang,"request_not_exist")));
                return;
            }

            if(method === "send"){
                if (queryRequest.SendUser._id.toString() != idAccount) {
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }
                if(response === "cancel"){
                    //surely
                    //do nothing
                    
                }
            }else{
                if (queryRequest.ReceiveUser._id.toString() != idAccount) {
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }
                if(response === "agree"){

                    let resAction = await AccountModel.getDataById(queryRequest.SendUser._id,req.lang);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(Message(req.lang,"system_error")));
                        console.log(2)
                        return;
                    }
                    let sendUser = resAction.data;

                    resAction = await AccountModel.getDataById(idAccount,req.lang);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(Message(req.lang,"system_error")));
                        console.log(3)
                        return;
                    }
                    let receiveUser = resAction.data;

                    //complete
                    //get exist friend chanel
                    resAction = await ChanelChatModel.checkAndGetFriendChanelChatOfUser(idAccount,receiveUser._id,req.lang);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(resAction.error));   
                        console.log(4)
                        return;
                    }
                    let chanelChatId = resAction.data;
                    if(chanelChatId==null){
                        //create chanel chat
                        resAction = await ChanelChatModel.createFriendChanelChat(idAccount,sendUser._id,req.lang);
                        if (resAction.status == ModelResponse.ResStatus.Fail) {
                            res.json(Controller.Fail(resAction.error));   
                            console.log(5)
                            return;
                        }
                        chanelChatId = resAction.data.id;
                    }

                    if(receiveUser.Friends.findIndex((e)=> e.User.toString()==sendUser._id)==-1){
                        //add
                        receiveUser.Friends.push({
                            User: sendUser._id,
                            ChanelChat: chanelChatId,
                        });

                        //update from receive user
                        resAction = await AccountModel.updateAccount(receiveUser._id, receiveUser,req.lang);
                        if (resAction.status == ModelResponse.ResStatus.Fail) {
                            res.json(Controller.Fail(resAction.error));   
                            console.log(6)
                            return;
                        }
                        
                    }

                    if(sendUser.Friends.findIndex((e)=> e.User.toString()==receiveUser._id)==-1){
                        //add
                        sendUser.Friends.push({
                            User: receiveUser._id,
                            ChanelChat: chanelChatId,
                        });
                    
                        //update from send user
                        resAction = await AccountModel.updateAccount(sendUser._id, sendUser,req.lang);
                        if (resAction.status == ModelResponse.ResStatus.Fail) {
                            res.json(Controller.Fail(resAction.error));   
                            console.log(7)
                            return;
                        }
                    }

                    //notification to me
                    NotificationTool.Friend.becomeFriend(
                        req,
                        receiveUser._id.toString(),
                        sendUser._id.toString(),
                        sendUser.Name);
                    //notification to friend
                    NotificationTool.Friend.becomeFriend(
                        req,
                        sendUser._id.toString(),
                        receiveUser._id.toString(),
                        receiveUser.Name);

                    
                    //delete old request
                    resAction = await FriendRequestModel.delete(req.lang, queryRequest._id);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(resAction.error));   
                        return;
                    }else{
                        res.json(Controller.Success({ isComplete: true, isFriend: true }));  
                        return;
                    }
                }else{
                    //do nothing
                }
                

            }
            //delete old request
            resAction = await FriendRequestModel.delete(req.lang, queryRequest._id);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            }else{
                res.json(Controller.Success({ isComplete: true}));  
                return;
            }
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http post, authen
    CancelFriend : async function(req,res){  
        try {
            let idAccount = req.user.id;

            let friendId = req.body.friend_id;

            if(idAccount == friendId){
                res.json(Controller.Fail(Message(req.lang,"user_receive_unvalid")));
                return;
            }

            //check exit friend
            let resAction = await AccountModel.getDataById(friendId,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(Message(req.lang,"user_receive_unvalid")));
                return;
            }
            let friendUser = resAction.data;

            //check friend list
            resAction = await AccountModel.getDataById(idAccount,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(Message(req.lang,"system_error")));
                return;
            }
            let ownUser = resAction.data;
            if(ownUser.Friends.findIndex((e)=> e.User.toString()==friendId)==-1 && friendUser.Friends.findIndex((e)=> e.User.toString()==idAccount)==-1){
                res.json(Controller.Fail(Message(req.lang,"user_receive_was_not_friend")));
                return;
            }
            
            //update from friend user
            let ind = friendUser.Friends.findIndex((e)=> e.User.toString()==idAccount);
            if (ind !== -1) {
                friendUser.Friends.splice(ind, 1);
                resAction = await AccountModel.updateAccount(friendUser._id, friendUser,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));   
                    return;
                }
            }
            
            //update from own user
            ind = ownUser.Friends.findIndex((e)=> e.User.toString()==friendId);
            if (ind !== -1) {
                ownUser.Friends.splice(ind, 1);
                resAction = await AccountModel.updateAccount(ownUser._id, ownUser,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));   
                    return;
                }
            }
            res.json(Controller.Success({ isComplete: true}));  
            return;
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
}  

module.exports = FriendController;