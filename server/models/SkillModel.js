const bcrypt = require('bcrypt');

const Message = require('../messages/Messages');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');

//specify the fields which we want in our collection(table).  
var SkillSchema = new mongoose.Schema({  
    Name: {
        type: String,
        required:true
    },
    IsActive: {
        type: Boolean,
        required:true
    },
    Image: {
        type: String,
        default:""
    },
    CreatedTime: {
        type: Number,
        default:0
    }
 })  
  
 //here we saving our collectionSchema with the name user in database  
 //AccountModel will contain the instance of the user for manipulating the data.  
var SkillModel = module.exports = mongoose.model('Skills',SkillSchema)  

module.exports.getAllSkills = async (languageMessage)=>{
    try {
        let resAction = await SkillModel.find({});
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getDataById = async (id,languageMessage)=>{
    try {
        let resAction = await SkillModel.findOne({ _id: id });
        if (resAction == null) {
            return ModelResponse.Fail(Message(languageMessage,"skill_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.createSkill = async function(newSkill,languageMessage){ 
    try {
        const Skill = new SkillModel({
            Name: newSkill.Name,
            IsActive: newSkill.IsActive,
            Image: newSkill.Image,
            CreatedTime:Date.now(),
        });  
        resAction = await SkillModel.create(Skill);
        return ModelResponse.Success({id:resAction._id});
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.updateSkill = async (id,SkillUpdate,languageMessage) => {  
    try {
        let resAction = await SkillModel.updateOne({ _id: id }, SkillUpdate);
        if (resAction.matchedCount != 1) {
            return ModelResponse.Fail(Message(languageMessage,"skill_not_exist"));
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.getAllSkillsByUser = async (languageMessage)=>{
    try {
        let resAction = await SkillModel.find({IsActive:true});
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
var isValidName = module.exports.isValidName = function(name="",languageMessage) {
    if (name.length > 0 && name.length <= 30) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"skill_name_constraint"));
    }
}
