const bcrypt = require('bcrypt');

const Message = require('../messages/Messages');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');

const KEYWORD_MAXIMUN_LENGTH = 30;

//specify the fields which we want in our collection(table).  
var CategoryKeywordSchema = new mongoose.Schema({  
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
var CategoryKeywordModel = module.exports = mongoose.model('CategoryKeywords',CategoryKeywordSchema)  

module.exports.getAllCategoryKeywords = async (languageMessage)=>{
    try {
        let resAction = await CategoryKeywordModel.find({});
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getDataById = async (id,languageMessage)=>{
    try {
        let resAction = await CategoryKeywordModel.findOne({ _id: id });
        if (resAction == null) {
            return ModelResponse.Fail(Message(languageMessage,"keyword_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.createCategoryKeyword = async function(newCategoryKeyword,languageMessage){ 
    try {
        const CategoryKeyword = new CategoryKeywordModel({
            Name: newCategoryKeyword.Name,
            IsActive: newCategoryKeyword.IsActive,
            ActionTime:Date.now(),
        });  
        resAction = await CategoryKeywordModel.create(CategoryKeyword);
        return ModelResponse.Success({id:resAction._id});
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.updateCategoryKeyword = async (id,CategoryKeywordUpdate,languageMessage) => {  
    try {
        let resAction = await CategoryKeywordModel.updateOne({ _id: id }, CategoryKeywordUpdate);
        if (resAction.matchedCount != 1) {
            return ModelResponse.Fail(Message(languageMessage,"keyword_not_exist"));
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.getAllCategoryKeywordsByUser = async (languageMessage)=>{
    try {
        let resAction = await CategoryKeywordModel.find({IsActive:true});
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
