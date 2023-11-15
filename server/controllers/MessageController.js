const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var ChanelChatModel = require('../models/ChanelChatModel');  
var AccountModel = require('../models/AccountModel');  
var MessageModel = require('../models/MessageModel');  
var Controller = require('./Controller');
var ChanelChatController = require('./ChanelChatController');
const MessageSocket = require("../controllers/Socket/MessageSocket");
const ChanelChatSocket = require("../controllers/Socket/ChanelChatSocket");
const MessageResponse = require("../client_data_response_models/Message");

const LIMIT_MESSAGES_PER_RESQUEST = 30;

const splitStringBaseParagraph = (str) => {
    if (str.length <= MessageModel.MAXIMUM_CONTENT_LENGTH) {
      return [str];
    }
    let resParagraphs = [''];
    let indexOfResParagraphs=0;
    let splitNewLine = str.split('\n');
    let indexOfLine = 0;
    while(indexOfLine<splitNewLine.length){
        if(resParagraphs[indexOfResParagraphs].length+splitNewLine[indexOfLine].length>MessageModel.MAXIMUM_CONTENT_LENGTH){
            if(splitNewLine[indexOfLine].length<=MessageModel.MAXIMUM_CONTENT_LENGTH){
                indexOfResParagraphs++;
                continue;
            }
            let firstSubLength = MessageModel.MAXIMUM_CONTENT_LENGTH-resParagraphs[indexOfResParagraphs].length;
            if(firstSubLength!=0)resParagraphs[indexOfResParagraphs]+=splitNewLine[indexOfLine].substr(0,firstSubLength);

            let otherSubsLength = splitNewLine[indexOfLine].length - firstSubLength;
            for(let i=0;i<otherSubsLength/MessageModel.MAXIMUM_CONTENT_LENGTH;i++){
                resParagraphs[++indexOfResParagraphs] = splitNewLine[indexOfLine].substr(i*MessageModel.MAXIMUM_CONTENT_LENGTH+firstSubLength,MessageModel.MAXIMUM_CONTENT_LENGTH);
            }
        }else{
            resParagraphs[indexOfResParagraphs]+=splitNewLine[indexOfLine];
            indexOfLine++;
        }
    }
    return resParagraphs;
};

var MessageController = { 

    //http get, authen
    GetMessagesOfChanelChat: async (req,res) => {
        try {
            let idAccount = req.user.id;
            let idChanelChat = req.query.id_chanel_chat;
            let lastTime = parseInt(req.query.last_time);

            if (idChanelChat == undefined || idChanelChat == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }
            if (lastTime == undefined || lastTime == "" || isNaN(lastTime)) {
                lastTime = Date.now();
            }

            let resAction = await ChanelChatModel.getDataById(idChanelChat,req.lang);
            let queryChanelChat = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                console.log(2)
                return;
            }
            //check is member
            if(queryChanelChat.Members.indexOf(idAccount)==-1){
                //not group member
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }

            resAction = await MessageModel.getMessagesHistory(idChanelChat,lastTime,LIMIT_MESSAGES_PER_RESQUEST+1,req.lang);
            let queryMessages = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                console.log(1)
                return;
            }
            
            let resMessages = new MessageResponse.Messages();
            if(queryMessages.length<LIMIT_MESSAGES_PER_RESQUEST+1){
                resMessages.isFinish = true;
            }else{
                resMessages.isFinish = false;
                queryMessages.splice(LIMIT_MESSAGES_PER_RESQUEST,1);
            }

            queryMessages.forEach((message)=>{
                resMessages.messages.push(new MessageResponse.Message(
                    message._id,
                    message.Content,
                    message.Owner._id,
                    // message.Owner.Name,
                    // message.Owner.Avatar,
                    message.Time,
                    message.Reply!=null?message.Reply.Content:null,
                    message.Reply!=null?message.Reply.Time:null,
                    message.Reply!=null?message.Reply._id:null,
                ));
            });
            // console.log(queryMessages)
            // console.log(resMessages)

            res.json(Controller.Success({ messages: resMessages }));  
        }  
        catch (error) {  
            console.log(error)
            res.json(Controller.Fail(Message(req.lang, "system_error")));  
        }  
    },
    //http get, authen
    GetMessagesOfChanelChatBetweenTime: async (req,res) => {
        try {
            let idAccount = req.user.id;
            let idChanelChat = req.query.id_chanel_chat;
            let lastTime = parseInt(req.query.last_time);
            let startTime = parseInt(req.query.start_time);

            if (idChanelChat == undefined || idChanelChat == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }
            if (lastTime == undefined || lastTime == "" || isNaN(lastTime)) {
                lastTime = Date.now();
            }
            if (startTime == undefined || startTime == "" || isNaN(startTime)) {
                startTime = 0;
            }

            let resAction = await ChanelChatModel.getDataById(idChanelChat,req.lang);
            let queryChanelChat = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            //check is member
            if(queryChanelChat.Members.indexOf(idAccount)==-1){
                //not group member
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }

            resAction = await MessageModel.getMessagesBetweenTime(idChanelChat,startTime,lastTime,req.lang);
            let queryMessages = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            
            let resMessages = new MessageResponse.Messages();
            resMessages.isFinish = false;

            queryMessages.forEach((message)=>{
                resMessages.messages.push(new MessageResponse.Message(
                    message._id,
                    message.Content,
                    message.Owner._id,
                    // message.Owner.Name,
                    // message.Owner.Avatar,
                    message.Time,
                    message.Reply!=null?message.Reply.Content:null,
                    message.Reply!=null?message.Reply.Time:null,
                    message.Reply!=null?message.Reply._id:null,
                ));
            });

            res.json(Controller.Success({ messages: resMessages }));  
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang, "system_error")));  
        }  
    },
    //http post, auth
    CreateMessage: async (req,res) => {
        try {
            let idAccount = req.user.id;
            let idChanelChat = req.body.id_chanel_chat;
            let idReply = req.body.id_reply;
            let content = req.body.content;

            if (idChanelChat == undefined || idChanelChat == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }
            if (idReply == undefined || idReply == "" ||idReply == "null") {
                idReply = null;
            }

            let contentSplit = splitStringBaseParagraph(content);
            //valid
            contentSplit.forEach((e)=>{
                let contentValid = MessageModel.isValidContent(e, req.lang);
                if (!contentValid.isValid) {
                    res.json(Controller.Fail(Message(req.lang, "system_error")));  
                    console.log(1)
                    return;
                }
            });

            let resAction = await ChanelChatModel.getDataById(idChanelChat,req.lang);
            let queryChanelChat = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            //check is member
            if(queryChanelChat.Members.indexOf(idAccount)==-1){
                //not group member
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }
            let queryReply = null;
            if(idReply!=null){
                //check exist reply
                resAction = await MessageModel.getDataById(idReply,req.lang);
                queryReply = resAction.data;
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    console.log(2)
                    return;
                }
                if(queryReply.ChanelChat.toString()!=idChanelChat){
                    //is not a message of this chanel chat
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return;
                }
            }

            let newMessageCount = contentSplit.length;
            let newInsertMessages = [];
            contentSplit.forEach((e,index)=>{
                newInsertMessages.push({
                    Content: e,
                    ChanelChat: queryChanelChat._id,
                    Owner:idAccount,
                    Time:Date.now(),
                    Reply:index==0?idReply:null
                });
            });

            
            resAction = await MessageModel.createMessages(newInsertMessages,req.lang);
            let queryInsertMessages = resAction.data.newMessages;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                console.log(3)
                return;
            }

            //update chanel chat
            let resupdateLastMessageOfChanelChat = await ChanelChatController.updateLastMessageOfChanelChat(req, idChanelChat, queryInsertMessages[newMessageCount-1]._id, queryInsertMessages[newMessageCount-1].Content,queryInsertMessages[newMessageCount-1].Time, idAccount, newMessageCount);
            //send to socket
            let socketResponseMessages=[];
            queryInsertMessages.forEach((e,index)=>{
                socketResponseMessages.push(new MessageResponse.MessageSocket(
                    e._id,
                    e.Content,
                    e.Owner.toString(),
                    e.ChanelChat.toString(),
                    e.Time,
                    queryReply==null?null:queryReply.Content,//only once repy for first message of new messages
                    queryReply==null?null:queryReply.Time,
                    queryReply==null?null:queryReply._id,
                ));
            });
            MessageSocket.sendRealTimeMessages(req.io, idChanelChat, socketResponseMessages);

            ChanelChatSocket.notifiUserSeen(req.io, idChanelChat, idAccount, queryInsertMessages[newMessageCount-1]._id);

            res.json(Controller.Success({ isCompleted: true }));  
        }  
        catch (error) {  
            console.log(error)
            res.json(Controller.Fail(Message(req.lang, "system_error")));  
        }  
    },
    //not http. is tool for other controller 
    //return list of id chanel chats. error is []
    // GetIdChanelChatsOfUser: async (idUser) => {
    //     try {
    //         let idAccount = idUser;

    //         let resAction = await ChanelChatModel.getChanelChatsOfUser(idAccount, req.lang);
    //         if (resAction.status == ModelResponse.ResStatus.Fail) {
    //             return [];
    //         }
    //         let chanelChats = resAction.data.filter(e=> e.Type!==ChanelChatModel.ChanelChatType.Team || e.Team.Members.indexOf(idAccount)!=-1) || [];
    //         let resIdChanelChats = [];
    //         chanelChats.forEach((e)=>{
    //             resIdChanelChats.push(e._id);
    //         });
    //         return resIdChanelChats;
    //     }  
    //     catch (error) {  
    //         return [];
    //     }  
    // },
}  

module.exports = MessageController;