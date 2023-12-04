const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var NotificationModel = require('../models/NotificationModel');  
var Controller = require('./Controller');
const NotificationSocket = require("./Socket/NotificationSocket");
const NotificationResponse = require("../client_data_response_models/Notification");
const NotificationContant = require("../notification_constants/NotificationContant");

const LIMIT_NOTIFICATIONs_PER_RESQUEST = 10;
const MAXIMUM_ITEM_IN_SUBJECTS_FIELD = 5;
const MAXIMUM_NAME_IN_SUBJECTS_OBJECT_MESSAGE = 2;

var NotificationController = { 

    //http get, authen
    GetNotificationsOfUser: async (req,res) => {
        try {
            let idAccount = req.user.id;
            let lastTime = parseInt(req.query.last_time);

            if (lastTime == undefined || lastTime == "" || isNaN(lastTime)) {
                lastTime = Date.now();
            }

            let resAction = await NotificationModel.getNotificationsOfUserLimit(idAccount,lastTime,LIMIT_NOTIFICATIONs_PER_RESQUEST+1,req.lang);
            let queryNotifications = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                console.log(1)
                return;
            }
            
            let resNotifications = new NotificationResponse.Notifications();
            if(queryNotifications.length<LIMIT_NOTIFICATIONs_PER_RESQUEST+1){
                resNotifications.isFinish = true;
            }else{
                resNotifications.isFinish = false;
                queryNotifications.splice(LIMIT_NOTIFICATIONs_PER_RESQUEST,1);
            }
            
            queryNotifications.forEach(e=>{
                resNotifications.notifications.push(convertToNotificationResponse(e,req.lang));
            })
            
            res.json(Controller.Success({ notifications: resNotifications }));  
        }  
        catch (error) {  
            console.log(error)
            res.json(Controller.Fail(Message(req.lang, "system_error")));  
        }  
    },
    //http get, authen
    GetNotification: async (req,res) => {
        try {
            let idAccount = req.user.id;
            let idNotification = req.query.id_notification;

            if (idNotification == undefined || idNotification == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await NotificationModel.getDataById(idNotification,req.lang);
            let queryNotification = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                console.log(1)
                return;
            }
            if(queryNotification.ReceiveUser.toString()!=idAccount){
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }
            res.json(Controller.Success(convertToNotificationResponse(queryNotification,req.lang) ));  
        }  
        catch (error) {  
            console.log(error)
            res.json(Controller.Fail(Message(req.lang, "system_error")));  
        }  
    },
    //http post, auth
    UserRead: async (req,res) => {
        try {
            let idAccount = req.user.id;
            let idNotification = req.body.id_notification;

            if (idNotification == undefined || idNotification == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await NotificationModel.getDataById(idNotification,req.lang);
            let queryNotification = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                console.log(1)
                return;
            }
            if(queryNotification.ReceiveUser.toString()!=idAccount){
                res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                return;
            }
            if(queryNotification.WasRead==true){
                res.json(Controller.Success({ isComplete: true }));  
                return;
            }
            
            //update
            let updateFields = {$set:{WasRead:true}};
            resAction = await NotificationModel.updateNotification(queryNotification._id, updateFields,req.lang);
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
    //not http. is tool for other controller 
    createOrUpdateNotification: async (req,notification,isOnceSubject=false) => {
        try {
            let resAction = await NotificationModel.checkAndGetDataByKey(notification.ReceiveUser,notification.Key,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                console.log(resAction.error);
                return false;
            }
            let queryNotification = resAction.data;
            if(queryNotification===null){
                //create
                resAction = await NotificationModel.createNotification(notification,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    console.log(resAction.error);
                    return false;
                }
                //send socket
                NotificationSocket.sendNewNitification(req.io,notification.ReceiveUser.toString(),resAction.data.id.toString());

            }else{
                //update
                if(isOnceSubject===true){
                    queryNotification.Subjects = notification.Subjects;
                    queryNotification.SubjectCount = queryNotification.Subjects.length;
                }else{
                    notification.Subjects.push(...(queryNotification.Subjects))
                    queryNotification.Subjects = notification.Subjects;
                    if(queryNotification.Subjects.length>MAXIMUM_ITEM_IN_SUBJECTS_FIELD){
                        queryNotification.Subjects.splice(MAXIMUM_ITEM_IN_SUBJECTS_FIELD);
                    }
                    queryNotification.SubjectCount+=notification.Subjects.length;
                }
                
                queryNotification.WasRead = false;
                queryNotification.CreatedAt = notification.CreatedAt;
                queryNotification.MainObject = notification.MainObject;
                queryNotification.SubObject = notification.SubObject;
                queryNotification.ContextObject = notification.ContextObject;

                let updateFields = {$set:{
                    Subjects:queryNotification.Subjects,
                    SubjectCount:queryNotification.SubjectCount,
                    WasRead:queryNotification.WasRead,
                    CreatedAt:queryNotification.CreatedAt,
                    MainObject:queryNotification.MainObject,
                    SubObject:queryNotification.SubObject,
                    ContextObject:queryNotification.ContextObject,
                }};
                resAction = await NotificationModel.updateNotification(queryNotification._id, updateFields,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    console.log(resAction.error);
                    return false;
                } else {
                    //send socket
                    NotificationSocket.sendNewNitification(req.io,queryNotification.ReceiveUser.toString(),queryNotification._id.toString());
                }
            }
            return true; 
        }  
        catch (error) {  
            console.log(error)
            return false; 
        }  
    },
     //not http. is tool for other controller 
    getNumberTotalNotReadNotificationsOfUser: async (req,idUser) => {
        try {
            let resAction = await NotificationModel.getNumberTotalNotReadNotificationsOfUser(idUser,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                return 0;
            }
            return resAction.data;
        }  
        catch (error) {  
            console.log(error)
            return 0; 
        }  
    },
    
}  

const convertToNotificationResponse=function(notifi, language){
    let resNotifi = new NotificationResponse.Notification();
    resNotifi.id = notifi._id;
    resNotifi.time = notifi.CreatedAt;
    resNotifi.wasRead = notifi.WasRead;
    resNotifi.directLink = notifi.Direction;

    resNotifi.content = NotificationContant.getMessageByCode(language,notifi.TypeCode);
    //subjects
    if(notifi.Subjects!=null){
        let subjects = "";
        notifi.Subjects.forEach((e,ind)=>{
            if(ind<MAXIMUM_NAME_IN_SUBJECTS_OBJECT_MESSAGE){
                if(ind!=0){
                    subjects+=", ";
                }
                subjects+=e.Name;
            }
        })
        if(notifi.SubjectCount>MAXIMUM_NAME_IN_SUBJECTS_OBJECT_MESSAGE){
            subjects+=NotificationContant.getMessage(language,"subjects_plus_person").replace("{{count}}",notifi.SubjectCount-MAXIMUM_NAME_IN_SUBJECTS_OBJECT_MESSAGE);
        }
        let newRange = getStyleRange(NotificationResponse.StyleOfRange.Bold,resNotifi.content,NotificationContant.GrammarObject.Subjects,subjects.length);
        if(newRange!=null)resNotifi.styleRanges.push(newRange);
        resNotifi.content=resNotifi.content.replace(NotificationContant.GrammarObject.Subjects,subjects);
    }

    //mainObject
    if(notifi.MainObject!=null){
        let mainObject = notifi.MainObject.Name;
        let newRange = getStyleRange(NotificationResponse.StyleOfRange.Bold,resNotifi.content,NotificationContant.GrammarObject.MainObject,mainObject.length);
        if(newRange!=null)resNotifi.styleRanges.push(newRange);
        resNotifi.content=resNotifi.content.replace(NotificationContant.GrammarObject.MainObject,mainObject);
    }

    //subObject
    if(notifi.SubObject!=null){
        let subObject = notifi.SubObject.Name;
        let newRange = getStyleRange(NotificationResponse.StyleOfRange.Bold,resNotifi.content,NotificationContant.GrammarObject.SubObject,subObject.length);
        if(newRange!=null)resNotifi.styleRanges.push(newRange);
        resNotifi.content=resNotifi.content.replace(NotificationContant.GrammarObject.SubObject,subObject);
    }

    //contextObject
    if(notifi.ContextObject!=null){
        let contextObject = notifi.ContextObject.Name;
        let newRange = getStyleRange(NotificationResponse.StyleOfRange.Bold,resNotifi.content,NotificationContant.GrammarObject.ContextObject,contextObject.length);
        if(newRange!=null)resNotifi.styleRanges.push(newRange);
        resNotifi.content=resNotifi.content.replace(NotificationContant.GrammarObject.ContextObject,contextObject);
    }

    return resNotifi;
}
const getStyleRange= function(style, fullText, oldText, newTextLength){
    let ind = fullText.indexOf(oldText);
    if(ind==-1)return null;
    return new NotificationResponse.StyleRange(style,ind,newTextLength);
}


module.exports = NotificationController;