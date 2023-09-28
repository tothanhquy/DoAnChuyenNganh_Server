const Message = require('../messages/Messages');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');

//specify the fields which we want in our collection(table).  
var AccountSkillSchema = new mongoose.Schema({  
    AccountId: {
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Accounts' 
    },
    SkillId: {
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Skills'
    },
 })  
  
 //here we saving our collectionSchema with the name user in database  
 //AccountModel will contain the instance of the user for manipulating the data.  
var AccountSkillModel = module.exports = mongoose.model('AccountSkills',AccountSkillSchema)  

module.exports.getSkills = async (languageMessage,idAccount)=>{
    try {
        let resAction = await AccountSkillModel.find({AccountId:idAccount});
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.deleteSkills = async (languageMessage,idAccount) => {  
    try {
        let resAction = await AccountSkillModel.deleteMany({ AccountId: idAccount });
        // if (resAction.deletedCount == 0) {
        //     return ModelResponse.Fail(Message(languageMessage,"account_skills_not_exist"));
        // } else {
            return ModelResponse.Success({isComplete: true});
        // }
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}

module.exports.insertSkills = async function(languageMessage,idAccount,newIdSkills=[]){ 
    try {
        if (newIdSkills.length == 0) {
            //empty list
            return ModelResponse.Fail(Message(languageMessage,"system_error"));
        }
        let newAccountSkills = [];
        newIdSkills.forEach(element => {
            newAccountSkills.push(
                new AccountSkillModel({
                    AccountId: idAccount,
                    SkillId:element
                })
            )
        });
        resAction = await AccountSkillModel.insertMany(newAccountSkills);
        return ModelResponse.Success({wasInsert:true});
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}