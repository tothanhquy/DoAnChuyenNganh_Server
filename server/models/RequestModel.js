const Message = require('../messages/Messages');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');

const MAXIMUM_TITLE_LENGTH = 200;
const MAXIMUM_CONTENT_LENGTH = 2000;

//specify the fields which we want in our collection(table).  
var RequestSchema = new mongoose.Schema({  
    Title: {
        type: String,
    },  
    Content: {
        type: String,
    },  
    IsWaiting: {
        type: Boolean,
        default: true
    },
    RequestType: {
        type: String,
        required:true,
    },
    WasReaded: {
        type: Boolean,
        default: false
    },
    WasResponsed: {
        type: Boolean,
        default: false
    },
    IsAgree: {
        type: Boolean,
        default: false
    },
    IsImportant: {
        type: Boolean,
        default: false
    },
    User: {
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Accounts' 
    },
    Team: {
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Teams' 
    },
    TeamLeader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Accounts' 
    },
    RequestTime: {
        type: Number,
        default:0
    },
    ResponseTime: {
        type: Number,
        default:0
    }
 })  
  
 //here we saving our collectionSchema with the name user in database  
 //RequestModel will contain the instance of the user for manipulating the data.  
var RequestModel = module.exports = mongoose.model('Requests',RequestSchema)  

RequestType = {
    Recruit: "recruit",
    Join: "join"
}

module.exports.RequestType= RequestType


module.exports.getDataById = async (id,languageMessage)=>{
    try {
        let resAction = await RequestModel.findOne({ _id: id });
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
module.exports.createRequest = async function(newRequest,languageMessage){ 
    try {
        const request = new RequestModel({
            RequestType: newRequest.RequestType,
            Title: newRequest.Title,
            Content: newRequest.Content,
            Team: newRequest.Team,
            User: newRequest.User,
            Leader: newRequest.Leader,
            RequestTime: newRequest.RequestTime
        });  
        resAction = await RequestModel.create(request);
        return ModelResponse.Success({id:resAction._id});
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.updateRequest = async (id,requestUpdate,languageMessage) => {  
    try {
        let resAction = await RequestModel.updateOne({ _id: id }, requestUpdate);
        if (resAction.matchedCount != 1) {
            return ModelResponse.Fail(Message(languageMessage,"request_not_exist"));
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
     
}
module.exports.getRequests = async (conditions,languageMessage)=>{
    try {
        let resAction = await RequestModel.find(conditions);
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getRequestsPopulateLimit = async (conditions,populateTeam,populateAccount,limit,languageMessage)=>{
    try {
        let resAction = await RequestModel.find(conditions).select("-Content").sort({RequestTime:-1}).populate(populateTeam).populate(populateAccount).limit(limit);
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
var isValidTitle = module.exports.isValidTitle = function(title,languageMessage) {
    if (title.length <= MAXIMUM_TITLE_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"request_title_constraint").replace('{{length}}', MAXIMUM_TITLE_LENGTH));
    }
}
var isValidContent = module.exports.isValidContent = function(content,languageMessage) {
    if (content.length <= MAXIMUM_CONTENT_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"request_content_constraint").replace('{{length}}',MAXIMUM_CONTENT_LENGTH ));
    }
}