const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
const FriendModelResponse = require('../client_data_response_models/Friend');
var AccountModel = require('../models/AccountModel');  
var FriendRequestModel = require('../models/FriendRequestModel');  
var Controller = require('./Controller');

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
                    path: 'Friends',
                    select: '_id Name Avatar'
                });
            
            friends = account.Friends.map(a=> FriendModelResponse.FriendListItem(a._id,a.Name,a.Avatar));
            
            res.json(Controller.Success({ friends:friends }));  
        }  
        catch (error) {  
            res.json(Controller.Fail(Message(req.lang, "system_error")));  
        }  
    },
    //http post, authen
    Create : async function(req,res){  
        try {
            let idAccount = req.user.id;

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
            if(friends.indexOf(userReceiveId)!=-1){
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

                resAction = await FriendRequestModel.create(requestModel,req.lang); 
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return;
                } else {
                    res.json(Controller.Success({ isComplete:true, isFriend: false }));
                    return;
                }
                
            }else if(friendRequest.SendUser === idAccount){
                //duplicate
                res.json(Controller.Fail(Message(req.lang,"friend_request_was_sent_before")));
                return;
            }else{
                // surely (friendRequest.SendUser === userReceiveId)
                //complete
                if(receiveUser.Friends.indexOf(idAccount)==-1){
                    //add
                    receiveUser.Friends.push(sendUser._id);

                    //update from receive user
                    resAction = await AccountModel.updateAccount(receiveUser._id, receiveUser,req.lang);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(resAction.error));   
                        return;
                    }
                    
                }

                if(sendUser.Friends.indexOf(receiveUser._id)==-1){
                    //add
                    sendUser.Friends.push(receiveUser._id);
                
                    //update from send user
                    resAction = await AccountModel.updateAccount(sendUser._id, sendUser,req.lang);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(resAction.error));   
                        return;
                    }
                }
                
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

            if(method==="send"){
                requests = queryRequests.map((a)=> new FriendModelResponse.FriendRequestsItem(a._id,a.SendUser._id,a.SendUser.Name,a.SendUser.Avater,a.RequestTime));
            }else{
                requests = queryRequests.map((a)=> new FriendModelResponse.FriendRequestsItem(a._id,a.ReceiveUser._id,a.ReceiveUser.Name,a.ReceiveUser.Avater,a.RequestTime));
            }
            
            res.json(Controller.Success(new FriendModelResponse.FriendRequests(
                timePrevious,
                isFinish,
                requests,
            )));  
        }  
        catch (error) {  
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
            
            let queryRequest = await RequestModel.findOne({ _id: requestId }).populate(populateUser);
            if (queryRequest == null) {
                res.json(Controller.Fail(Message(req.lang,"request_not_exist")));
                return;
            }

            if(method === "send"){
                if (queryRequest.SendUser._id.toString() != idAccount) {
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }
                res.json(Controller.Success(new FriendModelResponse.FriendRequest(queryRequest._id.toString(),queryRequest.Content,queryRequest.SendUser._id.toString(),queryRequest.SendUser.Name,queryRequest.SendUser.Avatar,queryRequest.RequestTime))); 
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

            let requestId = req.query.request_id;
            let method = req.query.method;
            let response = req.query.response;

            if (
                    !(method === "send" && response === "cancel" 
                ) && !(
                    method === "receive" && (response === "agree" || response === "disagree"))
                ) {
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }
            
            let populateUser = {
                path: 'SendUser ReceiveUser',
                select: '_id Name Avatar'
            };
            
            let queryRequest = await RequestModel.findOne({ _id: requestId }).populate(populateUser);
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
                        return;
                    }
                    let sendUser = resAction.data;

                    resAction = await AccountModel.getDataById(idAccount,req.lang);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(Message(req.lang,"system_error")));
                        return;
                    }
                    let receiveUser = resAction.data;

                    //complete
                    if(receiveUser.Friends.indexOf(sendUser._id)==-1){
                        //add
                        receiveUser.Friends.push(sendUser._id);

                        //update from receive user
                        resAction = await AccountModel.updateAccount(receiveUser._id, receiveUser,req.lang);
                        if (resAction.status == ModelResponse.ResStatus.Fail) {
                            res.json(Controller.Fail(resAction.error));   
                            return;
                        }
                        
                    }

                    if(sendUser.Friends.indexOf(receiveUser._id)==-1){
                        //add
                        sendUser.Friends.push(receiveUser._id);
                    
                        //update from send user
                        resAction = await AccountModel.updateAccount(sendUser._id, sendUser,req.lang);
                        if (resAction.status == ModelResponse.ResStatus.Fail) {
                            res.json(Controller.Fail(resAction.error));   
                            return;
                        }
                    }
                    
                    //delete old request
                    resAction = await FriendRequestModel.delete(req.lang, friendRequest._id);
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

}  

module.exports = FriendController;