const Comment = require('../Comments/Comments');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');

const MAXIMUM_CONTENT_LENGTH = 300;

//specify the fields which we want in our collection(table).  
var CommentSchema = new mongoose.Schema({  
    WasDeleted:{
        type:Boolean,
        default:false
    },
    Content: {
        type: String,
        required:true
    },
    Post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comments' ,
        required:true
    },
    Author: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Accounts',
        required:true
    },
    Time: {
        type: Number,
        default:0
    },
    ParentReply: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comments',
        default:null
    },
    Level: {
        type: Number,
        default:0
    },
    UsersLike:{
        type:[{
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Accounts',
            required:true
        }],
        default:[]
    },
    ChildsReplyNumber:{
        type:Number,
        default:0,
    }
 })  

 //here we saving our collectionSchema with the name user in database  
 //AccountModel will contain the instance of the user for manipulating the data.  
var CommentModel = module.exports = mongoose.model('Comments',CommentSchema,'Comments')  

module.exports.getComments = async (id_post,id_reply, time, limit, languageComment)=>{
    try {
        let resAction;
        if(id_reply==null){
            resAction = await CommentModel.find({"Post":new mongoose.Types.ObjectId(id_post),"ParentReply":null, Time:{$lte: time}}).sort({Time: -1}).limit(limit).populate("Author");
        }else{
            resAction = await CommentModel.find({"Post":new mongoose.Types.ObjectId(id_post),"ParentReply":new mongoose.Types.ObjectId(id_reply), Time:{$lte: time}}).sort({Time: -1}).limit(limit).populate("Author");
        }
        return ModelResponse.Success(resAction);
            
    } catch (err) {
        console.log(err)
        return ModelResponse.Fail(Comment(languageComment,"system_error"));
    } 
}
module.exports.getDataById = async (id,languageComment)=>{
    try {
        let resAction = await CommentModel.findOne({ _id: id }).populate("Author");
        if (resAction == null) {
            return ModelResponse.Fail(Comment(languageComment,"comment_not_exist")); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        console.log(err)
        return ModelResponse.Fail(Comment(languageComment,"system_error"));
    } 
}
module.exports.createComment = async function(newComments,languageComment){ 
    try {
        resAction = await CommentModel.create(newComments);
        return ModelResponse.Success({id:resAction._id.toString()});
    } catch (err) {
        console.log(err)
        return ModelResponse.Fail(Comment(languageComment,"system_error"));
    }
}
module.exports.getNumberCommentOfPost = async (idPost, languageMessage)=>{
    try {
        let count = await CommentModel.countDocuments({ Post: idPost});
        return ModelResponse.Success(count);
    } catch (err) {
        console.log(err)
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    } 
}
module.exports.updateComment = async (id,update,languageMessage) => {  
    try {
        let resAction = await CommentModel.updateOne({ _id: id }, update);
        if (resAction.matchedCount != 1) {
            return ModelResponse.Fail(Message(languageMessage,"comment_not_exist"));
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}
var isValidContent = module.exports.isValidContent = function(content="",languageComment) {
    if (content.length > 0 && content.length <= MAXIMUM_CONTENT_LENGTH) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(Comment(languageComment,"comment_content_constraint").replace('{{length}}',MAXIMUM_CONTENT_LENGTH ));
    }
}
module.exports.MAXIMUM_CONTENT_LENGTH = MAXIMUM_CONTENT_LENGTH;
