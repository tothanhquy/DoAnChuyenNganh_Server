const bcrypt = require('bcrypt');

const Message = require('../messages/Messages');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');

const MAXIMUM_CONTENT_LENGTH = 500;

//specify the fields which we want in our collection(table).  
var MessageSchema = new mongoose.Schema({  
    Content: {
        type: String,
        required:true
    },
    ChanelChat: {
        type: { type: mongoose.Schema.Types.ObjectId, ref: 'ChanelChats' },
        required:true
    },
    Owner: {
        type: { type: mongoose.Schema.Types.ObjectId, ref: 'Accounts' },
        required:true
    },
    Time: {
        type: Number,
        default:0
    },
    Reply: {
        type: { type: mongoose.Schema.Types.ObjectId, ref: 'Messages' },
        required:false
    },
 })  

 //here we saving our collectionSchema with the name user in database  
 //AccountModel will contain the instance of the user for manipulating the data.  
var MessageModel = module.exports = mongoose.model('Messages',MessageSchema,'Messages')  

module.exports.getMessagesOfChanelChat = async (id_chanel_chat, last_time, limit, languageMessage)=>{
    try {
        let resAction = await MessageModel.find({"ChanelChat":Schema.Types.ObjectId(id_chanel_chat), Time:{$lte: last_time}}).limit(limit).populate("Reply");
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getDataById = async (id,languageMessage)=>{
    try {
        let resAction = await MessageModel.findOne({ _id: id }).populate("Reply");
        if (resAction == null) {
            return ModelResponse.Fail(Message(languageMessage,"message_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.createMessage = async function(newMessage,languageMessage){ 
    try {
        const Message = new MessageModel({
            Content: newMessage.Content,
            ChanelChat: newMessage.ChanelChat,
            Reply: newMessage.Reply,
            Owner: newMessage.Owner,
            Time: newMessage.Time,
        });  
        resAction = await MessageModel.create(Message);
        return ModelResponse.Success({id:resAction._id});
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
var isValidContent = module.exports.isValidContent = function(content="",languageMessage) {
    if (content.length > 0 && content.length <= MAXIMUM_CONTENT_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"message_content_constraint").replace('{{length}}',MAXIMUM_CONTENT_LENGTH ));
    }
}
