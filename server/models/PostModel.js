const Message = require('../messages/Messages');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');

const MAXIMUM_CONTENT_LENGTH = 3000;
const MAXIMUM_IMAGES_COUNT = 10;

//specify the fields which we want in our collection(table).  
const UserSaveSchema = new mongoose.Schema({  
    User: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Accounts',
    },
    Time: {
        type: Number,
        default:0
    }
 })  
var PostSchema = new mongoose.Schema({  
    Content: {
        required:true,
        type: String,
    },  
    AuthorType: {
        type: String,
        required:true,
    },
    User: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Accounts' 
    },
    Team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teams' 
    },
    Project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Projects' 
    },
    PostTime: {
        type: Number,
        default:0
    },
    LastEditTime: {
        type: Number,
        default:0
    },
    Images: {
        type: [String],
        default:[]
    },
    IsActive: {
        type: Boolean,
        default:true
    },
    UsersSave: {
        type: [UserSaveSchema],
        default:[]
    },
    UsersLike: {
        type: [UserSaveSchema],
        default:[]
    },
    UsersFollow: {
        type: [UserSaveSchema],
        default:[]
    },
    CategoryKeywords: {
        type:[{
            type: mongoose.Schema.Types.ObjectId,
            required:true,
            ref: 'CategoryKeywords'
        }],
        default:[]
    },
 })  
  
 //here we saving our collectionSchema with the name user in database  
 //PostModel will contain the instance of the user for manipulating the data.  
var PostModel = module.exports = mongoose.model('Posts',PostSchema)  
module.exports.UserSaveObject = class{ 
    User=null;
    Time=0;
    constructor(user,time){
        this.User = user;
        this.Time=time;
    }
}
module.exports.MAXIMUM_IMAGES_COUNT = MAXIMUM_IMAGES_COUNT;
module.exports.PostObject = class{  
    Content= "";
    AuthorType=AuthorType.User;
    User= null;
    Team= null;
    Project=null;
    PostTime=0;
    LastEditTime=0;
    Images=[];
    IsActive=true;
    UsersSave=[];
    UsersLike=[];
    UsersFollow=[];
    CategoryKeywords=[];
    constructor(){}
}
const AuthorType = module.exports.AuthorType = {
    Team: "team",
    User:"user",
    Project:"project",
}

module.exports.getDataById = async (id,languageMessage)=>{
    try {
        let resAction = await PostModel.findOne({ _id: id }).populate("User").populate("Team").populate("Project");
        if (resAction == null) {
            return ModelResponse.Fail(Message(languageMessage,"post_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.createPost = async function(newPost,languageMessage){ 
    try { 
        resAction = await PostModel.create(newPost);
        return ModelResponse.Success({id:resAction._id});
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
module.exports.updatePost = async (id,requestUpdate,languageMessage) => {  
    try {
        let resAction = await PostModel.updateOne({ _id: id }, requestUpdate);
        if (resAction.matchedCount != 1) {
            return ModelResponse.Fail(Message(languageMessage,"post_not_exist"));
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
     
}
module.exports.getPosts = async (conditions,languageMessage)=>{
    try {
        let resAction = await PostModel.find(conditions);
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        console.log(err);
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
// module.exports.getPostsPopulateLimit = async (conditions,populateTeam,populateAccount,limit,languageMessage)=>{
//     try {
//         let resAction = await PostModel.find(conditions).sort({PostTime:-1}).populate(populateTeam).populate(populateAccount).limit(limit);
//         return ModelResponse.Success(resAction);
            
//     } catch (err) {
//         console.log(err);
//         return ModelResponse.Fail(Message(languageMessage,"system_error"));
//     } 
// }

var isValidContent = module.exports.isValidContent = function(content,languageMessage) {
    if (content.length >=1 && content.length <= MAXIMUM_CONTENT_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Message(languageMessage,"post_content_constraint").replace('{{length}}',MAXIMUM_CONTENT_LENGTH ));
    }
}