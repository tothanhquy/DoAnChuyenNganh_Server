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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChanelChats' ,
        required:true
    },
    Owner: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Accounts',
        required:true
    },
    Time: {
        type: Number,
        default:0
    },
    Reply: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Messages' ,
    },
 })  

 //here we saving our collectionSchema with the name user in database  
 //AccountModel will contain the instance of the user for manipulating the data.  
var MessageModel = module.exports = mongoose.model('Messages',MessageSchema,'Messages')  

module.exports.getMessagesHistory = async (id_chanel_chat, last_time, limit, languageMessage)=>{
    try {
        let resAction = await MessageModel.find({"ChanelChat":new mongoose.Types.ObjectId(id_chanel_chat), Time:{$lte: last_time}}).sort({Time: -1}).limit(limit).populate("Owner").populate("Reply");
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        console.log(err)
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getMessagesBetweenTime = async (id_chanel_chat, first_time, last_time, languageMessage)=>{
    try {
        let resAction = await MessageModel.find({"ChanelChat":new mongoose.Types.ObjectId(id_chanel_chat), Time:{$lte: last_time, $gte: first_time}}).sort({Time: -1}).populate("Owner").populate("Reply");
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        console.log(err)
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getDataById = async (id,languageMessage)=>{
    try {
        let resAction = await MessageModel.findOne({ _id: id });
        if (resAction == null) {
            return ModelResponse.Fail(Message(languageMessage,"message_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        console.log(err)
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.createMessages = async function(newMessages,languageMessage){ 
    try {
        resAction = await MessageModel.insertMany(newMessages);
        return ModelResponse.Success({newMessages:resAction});
    } catch (err) {
        console.log(err)
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
module.exports.MAXIMUM_CONTENT_LENGTH = MAXIMUM_CONTENT_LENGTH;
