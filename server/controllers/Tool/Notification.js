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

const ToolsOfNotification = {
    insertUsersToGroupChat: async (
        req, 
        receiveIdUsers, 
        idGroupChatOwner, 
        nameGroupChatOwner, 
        idGroupChat, 
        nameGroupChat)=>{
            try{
                for(let e in receiveIdUsers){
                    let notification = new NotificationModel.getNotificationAsObject();
                    notification.ReceiveUser = e;
                    notification.CreatedAt = Date.now();
                    notification.TypeCode = NotificationContant.TypeNotification.AddYouToGroupChat.Code;
                    notification.Key = NotificationContant.generatesKey(notification.TypeCode,idGroupChat);
                    notification.Direction = NotificationContant.DirectLink.ChanelChat.Details(idGroupChat);
                    notification.Subjects = [NotificationModel.getNotificationObjectAsObject(idGroupChatOwner,nameGroupChatOwner,NotificationContant.TypeObject.Account)];
                    notification.SubjectCount = 1;
                    notification.SubObject = NotificationModel.getNotificationObjectAsObject(idGroupChat,nameGroupChat,NotificationContant.TypeObject.ChanelChat);
                    //add
                    let res = await NotificationController.createOrUpdateNotification(req, notification);
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
        idGroupChatOwner, 
        nameGroupChatOwner, 
        oldNameGroupChat, 
        idGroupChat, 
        newNameGroupChat)=>{
            try{
                for(let e in receiveIdUsers){
                    let notification = new NotificationModel.getNotificationAsObject();
                    notification.ReceiveUser = e;
                    notification.CreatedAt = Date.now();
                    notification.TypeCode = NotificationContant.TypeNotification.ChangeNameGroupChat.Code;
                    notification.Key = NotificationContant.generatesKey(notification.TypeCode,idGroupChat);
                    notification.Direction = NotificationContant.DirectLink.ChanelChat.Details(idGroupChat);
                    notification.Subjects = [NotificationModel.getNotificationObjectAsObject(idGroupChatOwner,nameGroupChatOwner,NotificationContant.TypeObject.Account)];
                    notification.SubjectCount = 1;
                    notification.MainObject = NotificationModel.getNotificationObjectAsObject(idGroupChat,newNameGroupChat,NotificationContant.TypeObject.ChanelChat);
                    notification.SubObject = NotificationModel.getNotificationObjectAsObject("",oldNameGroupChat,NotificationContant.TypeObject.None);
                    //add
                    let res = await NotificationController.createOrUpdateNotification(req, notification);
                };
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    }
}
module.exports = ToolsOfNotification;