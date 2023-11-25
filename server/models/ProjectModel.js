const Message = require('../messages/Messages');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');

const MAXIMUM_NAME_LENGTH = 100;
const MAXIMUM_TAG_LENGTH = 20;
const MAXIMUM_SLOGON_LENGTH = 200;
const MAXIMUM_DESCRIPTION_LENGTH = 3500;
const MAXIMUM_RESOURCE_ALT_LENGTH = 200;
const MAXIMUM_MEMBER_ROLE_LENGTH = 100;
const MAXIMUM_TAG_COUNT = 7;
const MAXIMUM_VOTE_STAR = 5;

const ProjectMemberHistory = new mongoose.Schema({
    User:{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Accounts' 
    },
    Role:{
        type:String,
        default:null,
    },
    Time:{
        type:Number,
        default:0,
    },
    IsOut:{
        type:Boolean,
        default:false,
    },
});
const ProjectMemberNow = new mongoose.Schema({
    User:{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Accounts' 
    },
    Role:{
        type:String,
        default:null,
    },
});
const ProjectVoteStar = new mongoose.Schema({
    User:{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Accounts' 
    },
    Star:{
        type:Number,
        default:0,
    },
});
const ProjectResource = new mongoose.Schema({
    Path:{
        type:String,
        default:null,
    },
    Alt:{
        type:String,
        default:null,
    },
});
const ProjectNegativeReport = new mongoose.Schema({
    User:{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Accounts' 
    },
    NegativeReports:{
        type:[{
            type: mongoose.Schema.Types.ObjectId,
            required:true,
            ref: 'NegativeReportKeywords' 
        }],
        default:[]
    },
    Time:{
        type:Number,
        default:0,
    },
});
const ProjectInvitingMember = new mongoose.Schema({
    User:{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Accounts' 
    },
    Role:{
        type:String,
        default:null,
    },
    Time:{
        type:Number,
        default:0,
    },
});
//specify the fields which we want in our collection(table).  
var ProjectSchema = new mongoose.Schema({  
    Name: {
        type: String,
        required:true
    },  
    Avatar: {
        type:String,
        default:""
    },
    Leader: {
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Accounts' 
    },
    Members: {
        type: [ProjectMemberNow],
        default:[]
    },
    InvitingMembers: {
        type: [ProjectInvitingMember],
        default:[]
    },
    MembersHistory:{
        type:[ProjectMemberHistory],
        default:[]
    },
    Slogan: {
        type:String,
        default:""
    },  
    Description: {
        type:String,
        default:""
    },
    BanTime: {
        type: Number,
        default:0
    },
    CreatedTime: {
        type: Number,
        default:0
    },
    CategoryKeyWords: {
        type:[{
            type: mongoose.Schema.Types.ObjectId,
            required:true,
            ref: 'CategoryKeywords'
        }],
        default:[]
    },
    Images:{
        type:[ProjectResource],
        default:[]
    },
    Videos:{
        type:[ProjectResource],
        default:[]
    },
    UserFollows:{
        type:[{
            type: mongoose.Schema.Types.ObjectId,
            required:true,
            ref: 'Accounts' 
        }],
        default:[]
    },
    Tags:{
        type:[{type:String}],
        default:[]
    },
    VoteStars:{
        type:[ProjectVoteStar],
        default:[]
    },
    NegativeReports:{
        type:[ProjectNegativeReport],
        default:[]
    },
 })  
  
 //here we saving our collectionSchema with the name user in database  
 //ProjectModel will contain the instance of the user for manipulating the data.  
var ProjectModel = module.exports = mongoose.model('Projects',ProjectSchema)  
module.exports.ProjectMemberHistory = ProjectMemberHistory;
module.exports.ProjectMemberNow = ProjectMemberNow;
module.exports.ProjectVoteStar = ProjectVoteStar;
module.exports.ProjectResource = ProjectResource;
module.exports.ProjectNegativeReport = ProjectNegativeReport;
module.exports.ProjectInvitingMember = ProjectInvitingMember;
module.exports.MAXIMUM_TAG_COUNT = MAXIMUM_TAG_COUNT;

module.exports.getDataById = async (id,languageMessage)=>{
    try {
        let resAction = await ProjectModel.findOne({ _id: id });
        if (resAction == null) {
            return ModelResponse.Fail(Message(languageMessage,"project_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getProjectsOfUser = async (idUser,languageMessage)=>{
    try {
        let resAction = await ProjectModel.find({
            "Members.User":new mongoose.Types.ObjectId(idUser)
        }).populate("Leader");
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getProjectsWithUserAsInvitingMember = async (idUser,languageMessage)=>{
    try {
        let resAction = await ProjectModel.find({
            "InvitingMembers.User":new mongoose.Types.ObjectId(idUser)
        }).populate("Leader");
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getDataByIdPopulateBasic = async (id,languageMessage)=>{
    try {
        let resAction = await ProjectModel.findOne({ _id: id }).populate("Leader").populate("Members.User").populate("CategoryKeyWords");
        if (resAction == null) {
            return ModelResponse.Fail(Message(languageMessage,"project_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.createProject = async function(newProject,languageMessage){ 
    try {
        resAction = await ProjectModel.create(newProject);
        return ModelResponse.Success({id:resAction._id});
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.updateProject = async (id,projectUpdate,languageMessage) => {  
    try {
        let resAction = await ProjectModel.updateOne({ _id: id }, projectUpdate);
        if (resAction.matchedCount != 1) {
            return ModelResponse.Fail(Message(languageMessage,"project_not_exist"));
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
     
}
module.exports.getProjects = async (conditions,languageMessage)=>{
    try {
        let resAction = await ProjectModel.find(conditions);
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getProjectsPopulateCustom = async (conditions,populate,languageMessage)=>{
    try {
        let resAction = await ProjectModel.find(conditions).populate(populate);
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
        return ModelValid.Invalid(Message(languageMessage,"project_name_constraint").replace('{{length}}', MAXIMUM_NAME_LENGTH));
    }
}
var isValidSlogan = module.exports.isValidSlogan = function(slogan,languageMessage) {
    if (slogan.length <= MAXIMUM_SLOGON_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"project_slogan_constraint").replace('{{length}}', MAXIMUM_SLOGON_LENGTH));
    }
}
var isValidDescription = module.exports.isValidDescription = function(description,languageMessage) {
    if (description.length <= MAXIMUM_DESCRIPTION_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"project_description_constraint").replace('{{length}}',MAXIMUM_DESCRIPTION_LENGTH ));
    }
}
var isValidResourceAlt = module.exports.isValidResourceAlt = function(alt,languageMessage) {
    if (alt.length <= MAXIMUM_RESOURCE_ALT_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"project_resource_alt_constraint").replace('{{length}}',MAXIMUM_RESOURCE_ALT_LENGTH ));
    }
}
var isValidMemberRole = module.exports.isValidMemberRole = function(role,languageMessage) {
    if (role.length <= MAXIMUM_MEMBER_ROLE_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"project_member_role_constraint").replace('{{length}}',MAXIMUM_MEMBER_ROLE_LENGTH ));
    }
}
var isValidTag = module.exports.isValidTag = function(tag,languageMessage) {
    if (tag.length!=0 && tag.length <= MAXIMUM_TAG_LENGTH && tag.indexOf(" "==-1)) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"project_tag_constraint").replace('{{length}}',MAXIMUM_TAG_LENGTH ));
    }
}
var isValidTagNumber = module.exports.isValidTagNumber = function(tagNumber,languageMessage) {
    if (tagNumber <= MAXIMUM_TAG_COUNT) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"project_tag_number_constraint").replace('{{max}}',MAXIMUM_TAG_COUNT ));
    }
}
var isValidVoteStar = module.exports.isValidVoteStar = function(star,languageMessage) {
    if (star <= MAXIMUM_VOTE_STAR) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"project_vote_star_constraint").replace('{{max}}',MAXIMUM_VOTE_STAR ));
    }
}