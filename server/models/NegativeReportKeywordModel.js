const Message = require('../messages/Messages');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');

const KEYWORD_MAXIMUN_LENGTH = 70;

//specify the fields which we want in our collection(table).  
var NegativeReportKeywordSchema = new mongoose.Schema({  
    Name: {
        type: String,
        required:true
    },
    IsActive: {
        type: Boolean,
        required:true
    },
    ActionTime: {
        type: Number,
        default:0
    }
 })  
  
 //here we saving our collectionSchema with the name user in database  
 //AccountModel will contain the instance of the user for manipulating the data.  
var NegativeReportKeywordModel = module.exports = mongoose.model('NegativeReportKeywords',NegativeReportKeywordSchema)  

module.exports.getAllNegativeReportKeywords = async (languageMessage)=>{
    try {
        let resAction = await NegativeReportKeywordModel.find({});
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getDataById = async (id,languageMessage)=>{
    try {
        let resAction = await NegativeReportKeywordModel.findOne({ _id: id });
        if (resAction == null) {
            return ModelResponse.Fail(Message(languageMessage,"keyword_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.createNegativeReportKeyword = async function(newNegativeReportKeyword,languageMessage){ 
    try {
        const NegativeReportKeyword = new NegativeReportKeywordModel({
            Name: newNegativeReportKeyword.Name,
            IsActive: newNegativeReportKeyword.IsActive,
            ActionTime:Date.now(),
        });  
        resAction = await NegativeReportKeywordModel.create(NegativeReportKeyword);
        return ModelResponse.Success({id:resAction._id});
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.updateNegativeReportKeyword = async (id,NegativeReportKeywordUpdate,languageMessage) => {  
    try {
        let resAction = await NegativeReportKeywordModel.updateOne({ _id: id }, NegativeReportKeywordUpdate);
        if (resAction.matchedCount != 1) {
            return ModelResponse.Fail(Message(languageMessage,"keyword_not_exist"));
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.getAllNegativeReportKeywordsByUser = async (languageMessage)=>{
    try {
        let resAction = await NegativeReportKeywordModel.find({IsActive:true});
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
var isValidName = module.exports.isValidName = function(name="",languageMessage) {
    if (name.length > 0 && name.length <= KEYWORD_MAXIMUN_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"keyword_name_constraint").replace("{{length}}",KEYWORD_MAXIMUN_LENGTH));
    }
}
