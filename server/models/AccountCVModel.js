const Message = require('../messages/Messages');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');

//specify the fields which we want in our collection(table).  
var AccountCVSchema = new mongoose.Schema({  
    Name: {
        type: String,
        required:true
    },
    IsActive: {
        type: Boolean,
        required:true
    },
    FilePath: {
        type: String,
        default: "",
        required:true
    },
    AccountId: {
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Accounts' 
    },
    OwnerToken: {
        type: String,
        default: "",
    }
 })  
  
 //here we saving our collectionSchema with the name user in database  
 //AccountModel will contain the instance of the user for manipulating the data.  
var AccountCVModel = module.exports = mongoose.model('AccountCVs',AccountCVSchema)  

module.exports.getCVs = async (languageMessage,idAccount)=>{
    try {
        let resAction = await AccountCVModel.find({AccountId:idAccount});
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getCVById = async (languageMessage,idCV)=>{
    try {
        let resAction = await AccountCVModel.findOne({ _id: idCV });
        if (resAction == null) {
            return ModelResponse.Fail(Message(languageMessage,"cv_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.createCV = async function(languageMessage,newCV){ 
    try {
        const CV = new AccountCVModel({
            Name: newCV.Name,
            IsActive: newCV.IsActive,
            FilePath: newCV.FilePath,
            AccountId:newCV.AccountId,
        });  
        resAction = await AccountCVModel.create(CV);
        return ModelResponse.Success({id:resAction._id});
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.updateCV = async (languageMessage,idCV,CVUpdate) => {  
    try {
        let resAction = await AccountCVModel.updateOne({ _id: idCV }, CVUpdate);
        if (resAction.matchedCount != 1) {
            return ModelResponse.Fail(Message(languageMessage,"cv_not_exist"));
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.deleteCV = async (languageMessage,idCV) => {  
    try {
        let resAction = await AccountCVModel.deleteOne({ _id: idCV });
        if (resAction.deletedCount == 0) {
            return ModelResponse.Fail(Message(languageMessage,"cv_not_exist"));
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
var isValidName = module.exports.isValidName = function(languageMessage,name="") {
    if (name.length > 0 && name.length <= 50) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"cv_name_constraint"));
    }
}

module.exports.OWNER_TOKEN_TIME = 5 * 60 * 60 * 1000;//5 hour 