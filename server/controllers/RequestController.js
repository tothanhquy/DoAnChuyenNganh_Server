const ViewAlert = require('../view_models/ViewAlert');
const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var TeamModel = require('../models/TeamModel');  
var AccountModel = require('../models/AccountModel');  
var RequestModel = require('../models/RequestModel');  
const RequestModelRequestType = require('../models/RequestModel').RequestType;
var Auth = require('../core/Auth');  
const Mail = require('../core/Mail');
var Controller = require('./Controller');
const RequestResponse = require("../client_data_response_models/Request");

const GET_LIST_LIMIT_REQUESTS = 10;

//containt the function with business logics  
var RequestController = {  
    
    //http post, authen
    Create : async function(req,res){  
        try {  
            console.log(req.body)
            let idAccount = req.user.id;
            let creator = req.body.creator;

            if (creator != "leader" && creator != "user") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }
            let userId;
            if (creator == "leader") {
                userId = req.body.user_id;
            } else {
                userId = idAccount;
            }
            
            let teamId = req.body.team_id;
            let title = req.body.title;
            let content = req.body.content;

            //valid
            let titleValid = RequestModel.isValidTitle(title, req.lang);
            if (!titleValid.isValid) {
                res.json(Controller.Fail(titleValid.error));
                return;
            }
            let contentValid = RequestModel.isValidContent(content, req.lang);
            if (!contentValid.isValid) {
                res.json(Controller.Fail(contentValid.error));
                return;
            }

            //check team exist
            let resAction = await TeamModel.getDataById(teamId,req.lang);
            let queryTeam = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            if (creator == "leader") {
                //check is leader
                if (queryTeam.Leader.toString() != idAccount) {
                    //not leader
                    res.json(Controller.Fail(Message(req.lang, 'permissions_denied_action')));
                    return;
                }
                //check exist member account
                resAction = await AccountModel.getDataById(userId,req.lang); 
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(Message(req.lang,"member_unvalid")));
                    return;
                }
            }
            
            //check exist old member
            let memberExistIndex = queryTeam.Members.indexOf(userId);
            if (memberExistIndex != -1) {
                res.json(Controller.Fail(Message(req.lang,"was_a_member")));
                return;
            }

            let requestTypeCheck = (creator == "leader") ? RequestModelRequestType.Recruit : RequestModelRequestType.Join;
            //check only_one_request_one_time
            let only_one_request_one_timeCondition = {
                RequestType: requestTypeCheck,
                Team: teamId,
                User: userId,
                IsWaiting: true
            }
            resAction = await RequestModel.getRequests(only_one_request_one_timeCondition,req.lang); 
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            if (resAction.data.length != 0) {
                res.json(Controller.Fail(Message(req.lang,"only_one_request_one_time")));
                return;
            }

            let leaderId = (creator == "leader") ? idAccount : undefined;
            //create
            const requestModel = {  
                RequestType: requestTypeCheck,
                Title: title,
                Content: content,
                Team: teamId,
                User: userId,
                TeamLeader: leaderId,
                RequestTime: Date.now() 
            };   

            resAction = await RequestModel.createRequest(requestModel,req.lang); 
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
    //http get, authen
    GetList : async function(req,res){  
        try {  
            let idAccount = req.user.id;

            let viewer = req.query.viewer;
            let method = req.query.method;

            let timePrivious = req.query.time;
            if (timePrivious == undefined || timePrivious == 0) timePrivious = Date.now();

            if (viewer !== "leader" && viewer !== "user") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }
            if (method !== "send" && method !== "receive") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }

            let resAction;
            let condition;
            let populateAccount = {
                path: 'TeamLeader User',
                select: '_id Name Avatar'
            };
            let populateTeam = {
                path: 'Team',
                select: '_id Name Avatar'
            };
            if (viewer == "leader") {
                //team
                let teamId = req.query.team_id;
                //check team exist
                resAction = await TeamModel.getDataById(teamId,req.lang);
                let queryTeam = resAction.data;
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return;
                }
                //check is leader
                if (queryTeam.Leader.toString() != idAccount) {
                    //not leader
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }

                condition = {
                    RequestType:
                        method == "send" ?
                            RequestModelRequestType.Recruit
                            :
                            RequestModelRequestType.Join
                    ,
                    Team: teamId,
                    RequestTime: {$lt:timePrivious}
                }
                
            } else {
                //user
                condition = {
                    RequestType:
                        method == "send" ?
                            RequestModelRequestType.Join
                            :
                            RequestModelRequestType.Recruit
                    ,
                    User: idAccount,
                    RequestTime: {$lt:timePrivious}
                }
            }
            resAction = await RequestModel.getRequestsPopulateLimit(condition,populateTeam,populateAccount,GET_LIST_LIMIT_REQUESTS+1,req.lang); 
            let queryRequests = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            if (method == "send") {
                queryRequests.forEach(e => {
                    e.WasReaded = true;
                    e.IsImportant = false;
                })
            }
            let isFinish;
            let timePrevious;
            if (queryRequests.length == 0) {
                isFinish = true;
                timePrevious = 0;
            } else {
                isFinish = queryRequests.length != GET_LIST_LIMIT_REQUESTS + 1;
                if (!isFinish) queryRequests.splice(GET_LIST_LIMIT_REQUESTS, 1);
                timePrevious = queryRequests[queryRequests.length - 1].RequestTime;
            }
            res.json(Controller.Success(new RequestResponse.RequestsListObject(
                viewer,
                method,
                queryRequests,
                timePrevious,
                isFinish
            )));  
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http get, authen
    Details : async function(req,res){  
        try {  
            let idAccount = req.user.id;

            let viewer = req.query.viewer;
            let requestId = req.query.request_id;
            if (viewer !== "leader" && viewer !== "user") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }

            let populateAccount = {
                path: 'TeamLeader User',
                select: '_id Name Avatar'
            };
            let populateTeam = {
                path: 'Team',
                select: '_id Name Avatar'
            };
            // let resAction = await RequestModel.getDataById(requestId,req.lang);
            // let queryRequest = resAction.data;
            // if (resAction.status == ModelResponse.ResStatus.Fail) {
            //     res.json(Controller.Fail(resAction.error));
            //     return;
            // }
            // queryRequest = await queryRequest.populate(populateAccount).populate(populateTeam);
            let queryRequest = await RequestModel.findOne({ _id: requestId }).populate(populateAccount).populate(populateTeam);
            if (queryRequest == null) {
                res.json(Controller.Fail(Message(req.lang,"system_error")));
                return;
            }

            
            if (viewer == "leader") {
                //team
                let teamId = req.query.team_id;
                //check team exist
                resAction = await TeamModel.getDataById(teamId,req.lang);
                let queryTeam = resAction.data;
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return;
                }
                //check is leader
                if (queryTeam.Leader.toString() != idAccount) {
                    //not leader
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }
                //check team has request
                if (queryRequest.Team._id.toString() != teamId) {
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }
            } else {
                //user
                //check user has request
                if (queryRequest.User._id.toString() != idAccount) {
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }
            }
            
            let resultResponse = {
                request: {},
                requestMethod:""
            };
            if (
                (viewer == "leader" && queryRequest.RequestType == RequestModelRequestType.Recruit)||
                (viewer == "user" && queryRequest.RequestType == RequestModelRequestType.Join)
            ) {
                //send
                queryRequest.WasReaded = true;
                queryRequest.IsImportant = false;
                //property for client
                resultResponse.requestMethod = "send";
            } else {
                if (queryRequest.WasReaded==false) {
                    //update request was readed if account is receive user
                    queryRequest.WasReaded = true;
                    resAction = await RequestModel.updateRequest(queryRequest._id, queryRequest,req.lang);
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(resAction.error));   
                        return;
                    }
                }
                resultResponse.requestMethod = "receive";
            }
            resultResponse.request = queryRequest;
            res.json(Controller.Success(resultResponse)); 
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },

    //http post, authen
    Update : async function(req,res){  
        try {  
            let idAccount = req.user.id;

            let viewer = req.body.viewer;
            let status = req.body.status;
            let requestId = req.body.request_id;
            if (viewer !== "leader" && viewer !== "user") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }
            if (status !== "agree" && status !== "disagree" && status !== "cancel" && status !== "important") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }

            let resAction = await RequestModel.getDataById(requestId,req.lang);
            let editRequest = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            
            if (viewer == "leader") {
                //team
                let teamId = req.body.team_id;
                //check team exist
                resAction = await TeamModel.getDataById(teamId,req.lang);
                let queryTeam = resAction.data;
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return;
                }
                //check is leader
                if (queryTeam.Leader.toString() != idAccount) {
                    //not leader
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }
                //check team has request
                if (editRequest.Team.toString() != teamId) {
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }
            } else {
                //user
                //check user has request
                
                if (editRequest.User.toString() != idAccount) {
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }
            }

            if (editRequest.IsWaiting == false && status != "important") {
                res.json(Controller.Fail(Message(req.lang,"request_was_finish")));  
                return;
            }

            if (status == "cancel") {
                //check permisstions calcel able
                if (
                    (viewer == "leader" && editRequest.RequestType == RequestModelRequestType.Join)
                    ||(viewer == "user" && editRequest.RequestType == RequestModelRequestType.Recruit)
                )
                {
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }
                editRequest.IsWaiting = false;
            }else if (status == "important") {
                //check permisstions calcel important - receive user/team
                if (
                    (viewer == "leader" && editRequest.RequestType == RequestModelRequestType.Recruit)
                    ||(viewer == "user" && editRequest.RequestType == RequestModelRequestType.Join)
                )
                {
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }
                editRequest.IsImportant = !editRequest.IsImportant;
            }else{
                //check permisstions agree/disagree able
                if (
                    (viewer == "leader" && editRequest.RequestType == RequestModelRequestType.Recruit)
                    ||(viewer == "user" && editRequest.RequestType == RequestModelRequestType.Join)
                )
                {
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return; 
                }
                if (status == "disagree") {
                    editRequest.IsAgree = false;
                } else {
                    //get team when agree
                    resAction = await TeamModel.getDataById(editRequest.Team,req.lang);
                    let editTeam = resAction.data;
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(resAction.error));
                        return;
                    }
                    //check exist member
                    let idMember;
                    if (viewer == "leader") {
                        idMember = editRequest.User.toString();
                    } else {
                        idMember = idAccount;
                    }
                    let memberExistIndex = editTeam.Members.indexOf(idMember);
                    if (memberExistIndex != -1) {
                        // was a member

                        // res.json(Controller.Fail(Message(req.lang,"was_a_member")));
                        // return;
                    } else {
                        editTeam.Members.push(idMember);
                        //update team
                        resAction = await TeamModel.updateTeam(editTeam._id, editTeam,req.lang);
                        if (resAction.status == ModelResponse.ResStatus.Fail) {
                            res.json(Controller.Fail(resAction.error));   
                            return;
                        }
                        let updateChanelChat = await ChanelChatController.updateMembersOfTeamChanelChat(editTeam.ChanelChat);

                    }
                    editRequest.IsAgree = true;
                }
                editRequest.WasResponsed = true;
                editRequest.ResponseTime = Date.now();
                if (viewer == "leader") {
                    //update leader was agree
                    editRequest.TeamLeader = idAccount;
                }
                editRequest.IsWaiting = false;
            }
            //update request
            resAction = await RequestModel.updateRequest(editRequest._id, editRequest,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            }
            res.json(Controller.Success({isComplete:true}));   
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },

}  
  
module.exports = RequestController;