const bcrypt = require('bcrypt');

const Message = require('../messages/Messages');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');

const MAXIMUM_MAXIM_LENGTH = 200;
const MAXIMUM_DESCRIPTION_LENGTH = 1500;
const MAXIMUM_CONTACT_LENGTH = 300;
const MAXIMUM_CAREER_TARGET_LENGTH = 200;
const MAXIMUM_EDUCATION_LENGTH = 200;
const MAXIMUM_WORK_EXPERIENCE_LENGTH = 1000;


//specify the fields which we want in our collection(table).  
var AccountSchema = new mongoose.Schema({  
    Name: {
        type: String,
        required:true
    },  
    SearchName: {
        type: String,
        default:""
    },  
    Avatar: {
        type:String
    },
    Email: {
        type: String,
        required: true,
        unique: true
    },
    Password: {
        type: String,
        required:true
    },
    AccessTokens: {
        type: [String],
        default:[]
    },  
    BirthYear: {
        type: Number,
        default: 0
    },
    Maxim: String,  
    Description: String,  
    Contact: String,  
    CareerTarget: String,  
    Education: String,  
    WorkExperience: String,  
    Role: {
        type: String,
        default:'user'
    }, 
    IsAdmin: {
        type: Boolean,
        required: true,
        default:false,
    },
    IsVerifyEmail: {
        type: Boolean,
        required: true,
        default:false,
    },
    VerifyEmailToken: String,
    ResetPasswordToken: String,
    BanTime: {
        type: Number,
        default:0
    },
    Skills: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skills' }],
        default:[]
    },
    Friends: {
        type: [{
            User: { type: mongoose.Schema.Types.ObjectId, ref: 'Accounts' },
            ChanelChat: {type: mongoose.Schema.Types.ObjectId, ref: 'ChanelChats'}
        }],
        default:[]
    },
 })  
  
AccountSchema.index(
    {
        "SearchName": "text"
    }
)
 //here we saving our collectionSchema with the name user in database  
 //AccountModel will contain the instance of the user for manipulating the data.  
var AccountModel = module.exports = mongoose.model('Accounts',AccountSchema)  


module.exports.getDataById = async (id,languageMessage)=>{
    try {
        let resAction = await AccountModel.findOne({ _id: id });
        if (resAction == null) {
            return ModelResponse.Fail(Message(languageMessage,"account_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        console.log(err)
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.getDataByEmail = async (email,languageMessage)=>{
    try {
        let resAction = await AccountModel.findOne({ Email: email });
        if (resAction == null) {
            return ModelResponse.Fail(Message(languageMessage,"account_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.createAccount = async function(newAccount,languageMessage){ 
    try {
        const account = new AccountModel({
            Name: newAccount.Name,
            SearchName: newAccount.SearchName,
            Email: newAccount.Email,
            Password: newAccount.Password,
            VerifyEmailToken: "",
            IsAdmin: false,
            IsVerifyEmail:false,
        });  
        resAction = await AccountModel.create(account);
        return ModelResponse.Success({id:resAction._id});
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.updateAccount = async (id,accountUpdate,languageMessage) => {  
    try {
        let resAction = await AccountModel.updateOne({ _id: id }, accountUpdate);
        if (resAction.matchedCount != 1) {
            return ModelResponse.Fail(Message(languageMessage,"account_not_exist"));
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
     
}
module.exports.getAllUsersByAdmin = async (conditions,languageMessage)=>{
    try {
        let resAction = await AccountModel.find(conditions, { Email: 1, BanTime: 1, Name: 1});
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}

var isValidEmail = module.exports.isValidEmail=function(email,languageMessage) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9._]+\.[a-zA-Z]{2,}$/;
    if (emailRegex.test(email)) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"email_constraint"));
    }
}
var isValidPassword = module.exports.isValidPassword=function(password,languageMessage) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&])[A-Za-z\d@$!%?&]{8,}$/;
    if (passwordRegex.test(password)) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"password_constraint"));
    }
}
var isValidName = module.exports.isValidName = function(name="",languageMessage) {
    if (name.length > 0 && name.length <= 50) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"account_name_constraint"));
    }
}
var isValidBirthYear = module.exports.isValidBirthYear = function(year,languageMessage) {
    if (year<=(new Date()).getFullYear()) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"birth_year_invalid"));
    }
}
var isValidMaxim = module.exports.isValidMaxim = function(maxim,languageMessage) {
    if (maxim.length <= MAXIMUM_MAXIM_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"account_maxim_constraint").replace('{{length}}', MAXIMUM_MAXIM_LENGTH));
    }
}
var isValidDescription = module.exports.isValidDescription = function(description,languageMessage) {
    if (description.length <= MAXIMUM_DESCRIPTION_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"account_description_constraint").replace('{{length}}',MAXIMUM_DESCRIPTION_LENGTH ));
    }
}
var isValidContact = module.exports.isValidContact = function(contact,languageMessage) {
    if (contact.length <= MAXIMUM_CONTACT_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"account_contact_constraint").replace('{{length}}',MAXIMUM_CONTACT_LENGTH ));
    }
}
var isValidCareerTarget = module.exports.isValidCareerTarget = function(careerTarget,languageMessage) {
    if (careerTarget.length <= MAXIMUM_CAREER_TARGET_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"account_career_target_constraint").replace('{{length}}',MAXIMUM_CAREER_TARGET_LENGTH ));
    }
}
var isValidEducation = module.exports.isValidEducation = function(education,languageMessage) {
    if (education.length <= MAXIMUM_EDUCATION_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"account_education_constraint").replace('{{length}}',MAXIMUM_EDUCATION_LENGTH ));
    }
}
var isValidWorkExperience = module.exports.isValidWorkExperience = function(WorkExperience,languageMessage) {
    if (WorkExperience.length <= MAXIMUM_WORK_EXPERIENCE_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"account_work_experience_constraint").replace('{{length}}',MAXIMUM_WORK_EXPERIENCE_LENGTH ));
    }
}
module.exports.VerifyEmailTime = 10 * 60 * 1000;//10 minus
module.exports.ResetPasswordTime = 10 * 60 * 1000;//10 minus
// module.exports.AccessTokenTime = 30 * 24 * 60 * 60 * 1000;//1 month

module.exports.hashPassword = async function (password) {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
}