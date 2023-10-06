const Message = require('../messages/Messages');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');

const MAXIMUM_CONTENT_LENGTH = 300;

//specify the fields which we want in our collection(table).  
var FriendRequestSchema = new mongoose.Schema({  
    Content: {
        type: String,
    },
    SendUser: {
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Accounts' 
    },
    ReceiveUser: {
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Accounts' 
    },
    RequestTime: {
        type: Number,
        required:true,
        default:0
    }
 })  
  
 //here we saving our collectionSchema with the name user in database  
 //RequestModel will contain the instance of the user for manipulating the data.  
var FriendRequestModel = module.exports = mongoose.model('FriendRequests',FriendRequestSchema)  


module.exports.getDataById = async (id,languageMessage)=>{
    try {
        let resAction = await FriendRequestModel.findOne({ _id: id });
        if (resAction == null) {
            return ModelResponse.Fail(Message(languageMessage,"request_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.checkAndGetRequestByUser = async (userSendId,userReceiveId,languageMessage)=>{
    try {
        let resAction = await FriendRequestModel.findOne({ $or:[ {$and:[{SendUser: userSendId},{ReceiveUser: userReceiveId}]},{$and:[{SendUser: userReceiveId},{ReceiveUser: userSendId}]}] });
        if (resAction == null) {
            return ModelResponse.Success(null); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getRequestsPopulateLimit = async (conditions,populateUser,limit,languageMessage)=>{
    try {
        let resAction = await FriendRequestModel.find(conditions).select("-Content").sort({RequestTime:-1}).populate(populateUser).limit(limit);
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.createFriendRequest = async function(newRequest,languageMessage){ 
    try {
        const request = new FriendRequestModel({
            Content: newRequest.Content,
            SendUser: newRequest.SendUser,
            ReceiveUser: newRequest.ReceiveUser,
            RequestTime: newRequest.RequestTime
        });  
        let resAction = await FriendRequestModel.create(request);
        return ModelResponse.Success({id:resAction._id});
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.delete = async (languageMessage,id) => {  
    try {
        let resAction = await FriendRequestModel.deleteOne({ _id: id });
        if (resAction.deletedCount == 0) {
            return ModelResponse.Fail(Message(languageMessage,"request_not_exist"));
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
// module.exports.getRequestsPopulateLimit = async (conditions,populateTeam,populateAccount,limit,languageMessage)=>{
//     try {
//         let resAction = await FriendRequestModel.find(conditions).select("-Content").sort({RequestTime:-1}).populate(populateTeam).populate(populateAccount).limit(limit);
//         return ModelResponse.Success(resAction);
            
//     } catch (err) {
//         console.log(err);
//         return ModelResponse.Fail(Message(languageMessage,"system_error"));
//     } 
// }

var isValidContent = module.exports.isValidContent = function(content,languageMessage) {
    if (content.length <= MAXIMUM_CONTENT_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"request_content_constraint").replace('{{length}}',MAXIMUM_CONTENT_LENGTH ));
    }
}