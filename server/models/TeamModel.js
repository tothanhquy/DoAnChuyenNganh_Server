const bcrypt = require('bcrypt');

const Message = require('../messages/Messages');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');

const MAXIMUM_NAME_LENGTH = 100;
const MAXIMUM_MAXIM_LENGTH = 200;
const MAXIMUM_DESCRIPTION_LENGTH = 3500;
const MAXIMUM_INTERNAL_INFO_LENGTH = 3500;


//specify the fields which we want in our collection(table).  
var TeamSchema = new mongoose.Schema({  
    Name: {
        type: String,
        required:true
    },  
    Avatar: {
        type:String
    },
    Leader: {
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Accounts' 
    },
    Members: {
        type: [{ type: mongoose.Schema.Types.ObjectId,ref: 'Accounts' }],
        default:[]
    },
    Maxim: String,  
    Description: String,
    InternalInfo: String,
    BanTime: {
        type: Number,
        default:0
    },
    ChanelChat: {
        type: mongoose.Schema.Types.ObjectId,
        required:false,
        default:null,
        ref: 'ChanelChats' 
    },
 })  
  
 //here we saving our collectionSchema with the name user in database  
 //TeamModel will contain the instance of the user for manipulating the data.  
var TeamModel = module.exports = mongoose.model('Teams',TeamSchema)  


module.exports.getDataById = async (id,languageMessage)=>{
    try {
        let resAction = await TeamModel.findOne({ _id: id });
        if (resAction == null) {
            return ModelResponse.Fail(Message(languageMessage,"team_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.createTeam = async function(newTeam,languageMessage){ 
    try {
        const team = new TeamModel({
            Name: newTeam.Name,
            Leader: newTeam.Leader,
            Members: newTeam.Members,
        });  
        resAction = await TeamModel.create(team);
        return ModelResponse.Success({id:resAction._id});
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.updateTeam = async (id,teamUpdate,languageMessage) => {  
    try {
        let resAction = await TeamModel.updateOne({ _id: id }, teamUpdate);
        if (resAction.matchedCount != 1) {
            return ModelResponse.Fail(Message(languageMessage,"team_not_exist"));
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
     
}
module.exports.getTeams = async (conditions,languageMessage)=>{
    try {
        let resAction = await TeamModel.find(conditions);
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getTeamsPopulate = async (conditions,populate,languageMessage)=>{
    try {
        let resAction = await TeamModel.find(conditions).populate(populate);
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
var isValidName = module.exports.isValidName = function(name="",languageMessage) {
    if (name.length > 0 && name.length <= MAXIMUM_NAME_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"team_name_constraint").replace('{{length}}', MAXIMUM_NAME_LENGTH));
    }
}
var isValidMaxim = module.exports.isValidMaxim = function(maxim,languageMessage) {
    if (maxim.length <= MAXIMUM_MAXIM_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"team_maxim_constraint").replace('{{length}}', MAXIMUM_MAXIM_LENGTH));
    }
}
var isValidDescription = module.exports.isValidDescription = function(description,languageMessage) {
    if (description.length <= MAXIMUM_DESCRIPTION_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"team_description_constraint").replace('{{length}}',MAXIMUM_DESCRIPTION_LENGTH ));
    }
}
var isValidInternalInfo = module.exports.isValidInternalInfo = function(internalInfo,languageMessage) {
    if (internalInfo.length <= MAXIMUM_INTERNAL_INFO_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"team_internal_info_constraint").replace('{{length}}',MAXIMUM_DESCRIPTION_LENGTH ));
    }
}