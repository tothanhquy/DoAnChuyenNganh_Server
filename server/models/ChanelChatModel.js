const bcrypt = require('bcrypt');

const Message = require('../messages/Messages');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');



const MAXIMUM_NAME_LENGTH = 50;

//specify the fields which we want in our collection(table).  
var ChanelChatSchema = new mongoose.Schema({  
    Name: {
        type: String,
        default:""
    },
    Image: {
        type: String,
        default:""
    },
    Type: {
        type: String,
        required:true,
    },
    Members: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Accounts' }],
        default:[]
    },
    GroupOwner: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Accounts' ,
    },
    Team: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Teams' ,
    },
    LastMessage:{type: mongoose.Schema.Types.ObjectId, ref: 'Messages',default:null},
    LastTimeMemberSeen: {
        type: [{ 
            User:{type: mongoose.Schema.Types.ObjectId, ref: 'Accounts'} ,
            Message:{type: mongoose.Schema.Types.ObjectId, ref: 'Messages', default:null} ,
            Number:{type: Number, default: 0} ,
        }],
        default:[]
    },
    LastTimeAction:{type: Number, default: 0} ,
 })  
  
 //here we saving our collectionSchema with the name user in database  
 //AccountModel will contain the instance of the user for manipulating the data.  
var ChanelChatModel = module.exports = mongoose.model('ChanelChats',ChanelChatSchema)  

const ChanelChatType = {
    Friend: "friend",
    Group: "group",
    Team: "team",
}

module.exports.ChanelChatType = ChanelChatType;

module.exports.getChanelChatsOfUser = async (id_user, languageMessage)=>{
    try {
        let resAction = await ChanelChatModel.find({
                "Members":new mongoose.Types.ObjectId(id_user)
        }).populate("Team").populate("Members").populate('LastMessage');
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        console.log(err)
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getDataByIdPopulateMembers = async (id,languageMessage)=>{
    try {
        let resAction = await ChanelChatModel.findOne({ _id: id }).populate("Team").populate("Members").populate('LastMessage');
        if (resAction == null) {
            return ModelResponse.Fail(Message(languageMessage,"chanel_chat_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        console.log(err)
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getDataById = async (id,languageMessage)=>{
    try {
        let resAction = await ChanelChatModel.findOne({ _id: id }).populate("Team").populate('LastMessage');
        if (resAction == null) {
            return ModelResponse.Fail(Message(languageMessage,"chanel_chat_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        console.log(err)
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.checkAndGetFriendChanelChatOfUser = async (id_user, id_friend, languageMessage)=>{
    try {
        let resAction = await ChanelChatModel.findOne(
            { 
                "Type": ChanelChatType.Friend, 
                $and:[
                    {"Members":new mongoose.Types.ObjectId(id_user)},
                    {"Members":new mongoose.Types.ObjectId(id_friend)}
                ]
            });
        if (resAction == null) {
            return ModelResponse.Success(null);//not exist
        } else {
            return ModelResponse.Success(resAction._id);
        }
            
    } catch (err) {
        console.log(err)
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.createGroupChanelChat = async function(newChanelChat,languageMessage){ 
    try {
        const ChanelChat = new ChanelChatModel({
            Name: newChanelChat.Name,
            Type: ChanelChatType.Group,
            Image: newChanelChat.Image,
            Members: newChanelChat.Members,
            GroupOwner: newChanelChat.GroupOwner,
            LastTimeAction:Date.now(),
            Team: null,
        });  
        resAction = await ChanelChatModel.create(ChanelChat);
        return ModelResponse.Success({newChanelChat:resAction});
    } catch (err) {
        console.log(err)
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.createFriendChanelChat = async function(id_user, id_friend, languageMessage){ 
    try {
        const ChanelChat = new ChanelChatModel({
            Name: "",
            Type: ChanelChatType.Friend,
            Image: "",
            Members: [new mongoose.Types.ObjectId(id_user),new mongoose.Types.ObjectId(id_friend)],
            GroupOwner: null,
            LastTimeAction:Date.now(),
            Team: null,
        });  
        resAction = await ChanelChatModel.create(ChanelChat);
        return ModelResponse.Success({id:resAction._id});
    } catch (err) {
        console.log(err)
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.createTeamChanelChat = async function(id_team, languageMessage){ 
    try {
        const ChanelChat = new ChanelChatModel({
            Name: "",
            Type: ChanelChatType.Team,
            Image: "",
            Members: [],
            GroupOwner: null,
            LastTimeAction:Date.now(),
            Team: new mongoose.Types.ObjectId(id_team),
        });  
        resAction = await ChanelChatModel.create(ChanelChat);
        return ModelResponse.Success({id:resAction._id});
    } catch (err) {
        console.log(err)
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.updateChanelChat = async (id,ChanelChatUpdate,languageMessage) => {  
    try {
        let resAction = await ChanelChatModel.updateOne({ _id: id }, ChanelChatUpdate);
        if (resAction.matchedCount != 1) {
            return ModelResponse.Fail(Message(languageMessage,"chanel_chat_not_exist"));
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.delete = async (id, languageMessage) => {  
    try {
        let resAction = await ChanelChatModel.deleteOne({ _id: id });
        if (resAction.deletedCount == 0) {
            return ModelResponse.Fail(Message(languageMessage,"chanel_chat_not_exist"));
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
var isValidName = module.exports.isValidName = function(name="",languageMessage) {
    if (name.length > 0 && name.length <= MAXIMUM_NAME_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"chanel_chat_name_constraint").replace('{{length}}',MAXIMUM_NAME_LENGTH ));
    }
}
