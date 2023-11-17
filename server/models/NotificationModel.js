const Message = require('../messages/Messages');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');

//specify the fields which we want in our collection(table).  
var NotificationObjectSchema = new mongoose.Schema({  
    Id: {
        type: String,
        default:"",
    },
    Name: {
        type: String,
        default:"",
    },
    Type: {
        type: String,
        required:true,
        default:"",
    },
 })  
var NotificationSchema = new mongoose.Schema({  
    ReceiveUser: {
        type:mongoose.Schema.Types.ObjectId, 
        ref: 'Accounts',
        required:true,
    },
    CreatedAt: {
        type: Number,
        default:0
    },
    WasRead: {
        type: Boolean,
        default:false
    },
    TypeCode: {
        type: Number,
        default:0
    },
    Key: {
        type: String,
        default:""
    },
    Direction: {
        type: String,
        default:""
    },
    Subjects: {
        type: [NotificationObjectSchema],
        default:[],
    },
    SubjectCount: {
        type: Number,
        default:0
    },
    MainObject: {
        type: NotificationObjectSchema,
        default:null,
    },
    SubObject: {
        type: NotificationObjectSchema,
        default:null,
    },
    ContextObject: {
        type: NotificationObjectSchema,
        default:null,
    },
 })  
  
 //here we saving our collectionSchema with the name user in database  
 //AccountModel will contain the instance of the user for manipulating the data.  
var NotificationModel = module.exports = mongoose.model('Notifications',NotificationSchema)  
module.exports.NotificationObject = NotificationObjectSchema;

module.exports.getDataById = async (id,languageMessage)=>{
    try {
        let resAction = await NotificationModel.findOne({ _id: id });
        if (resAction == null) {
            return ModelResponse.Fail(Message(languageMessage,"notification_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.checkAndGetDataByKey = async (idUser, key, languageMessage)=>{
    try {
        let resAction = await NotificationModel.findOne({ ReceiveUser: idUser, Key:key });
        if (resAction == null) {
            return ModelResponse.Success(null); 
        } else {
            return ModelResponse.Success(resAction);
        }
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.createNotification = async function(newNotification,languageMessage){ 
    try {
        resAction = await NotificationModel.create(newNotification);
        return ModelResponse.Success({id:resAction._id});
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.updateNotification = async (id,NotificationUpdate,languageMessage) => {  
    try {
        let resAction = await NotificationModel.updateOne({ _id: id }, NotificationUpdate);
        if (resAction.matchedCount != 1) {
            return ModelResponse.Fail(Message(languageMessage,"notification_not_exist"));
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.getNotificationsOfUserLimit = async (idUser,lastTime,limit,languageMessage)=>{
    try {
        let resAction = await NotificationModel.find({ReceiveUser:idUser,CreatedAt:{$lte:lastTime}}).sort({CreatedAt:-1}).limit(limit);
        return ModelResponse.Success(resAction);
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}

module.exports.getNotificationAsObject=function(){
    return {
        ReceiveUser: null,
        CreatedAt: 0,
        WasRead: false,
        TypeCode: 0,
        Key: "",
        Direction: "",
        Subjects: [],
        SubjectCount: 0,
        MainObject: null,
        SubObject: null,
        ContextObject: null,
    };
}
module.exports.getNotificationObjectAsObject=function(id,name,type){
    return {
        Id:id,
        Name:name,
        Type:type
    };
}
