const Messages = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var AccountModel = require('../models/AccountModel');  
var CommentModel = require('../models/CommentModel');  
var Controller = require('./Controller');
var PostController = require('./PostController');
const CommentResponse = require("../client_data_response_models/Comment");

const LIMIT_COMMENTS_PER_RESQUEST = 5;
const USER_INTERACT_REQUEST_STATUS={
    Like:"like",
    Delete:"delete"
}
var CommentController = { 

    //http get
    GetComments: async (req,res) => {
        try {
            let idAccount = undefined;
            let account = await Auth.CheckAndGetAuthenUser(req);
            if (account != false) { 
                idAccount = account.id;
            }

            let idPost = req.query.id_post;
            let idReply = req.query.id_reply;
            let lastTime = parseInt(req.query.last_time);

            if (idPost == undefined || idPost == "") {
                res.json(Controller.Fail(Messages(req.lang, "system_error")));
                return; 
            }
            if (idReply == undefined) {
                idReply="";
            }
            if (lastTime == undefined || lastTime == "" || isNaN(lastTime)) {
                lastTime = Date.now();
            }

            let resAction = await CommentModel.getComments(idPost,idReply,lastTime,LIMIT_COMMENTS_PER_RESQUEST+1,req.lang);
            let queryComments = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            
            let resComments = new CommentResponse.Comments();
            resComments.isActionable=idAccount!=undefined;
            let isLoadMore = false;
            if(queryComments.length<LIMIT_COMMENTS_PER_RESQUEST+1){
            }else{
                isLoadMore=true;
                queryComments.splice(LIMIT_COMMENTS_PER_RESQUEST,1);
            }
            let count= queryComments.length;
            queryComments.forEach((comment,index)=>{
                resComments.comments.push(new CommentResponse.Comment(
                    comment._id.toString(),
                    comment.WasDeleted,
                    comment.WasDeleted?"":comment.Content,
                    comment.Post.toString(),
                    comment.Author._id.toString(),
                    comment.Author.Name,
                    comment.Author.Avatar,
                    comment.Time,
                    comment.ParentReply.toString(),
                    comment.Level,
                    comment.UsersLike.length,
                    idAccount!=undefined&&comment.UsersLike.findIndex(e=>e.toString()==idAccount)!=-1,
                    comment.ChildsreplyNumber,
                    index==count-1&&isLoadMore,
                    idAccount!=undefined&&idAccount==comment.Author._id.toString()
                ));
            });

            res.json(Controller.Success(resComments));  
        }  
        catch (error) {  
            console.log(error)
            res.json(Controller.Fail(Messages(req.lang, "system_error")));  
        }  
    },
    
    //http post, auth
    CreateComment: async (req,res) => {
        try {
            let idAccount = req.user.id;
            let idPost = req.body.id_post;
            let idReply = req.body.id_reply;
            let content = req.body.content;

            if (idPost == undefined || idPost == "") {
                res.json(Controller.Fail(Messages(req.lang, "system_error")));
                return; 
            }
            if (idReply == undefined || idReply == "" ||idReply == "null") {
                idReply = null;
            }

            let contentValid = CommentModel.isValidContent(content, req.lang);
            if (!contentValid.isValid) {
                res.json(Controller.Fail(Messages(req.lang, "system_error")));  
                return;
            }

            //check exit post
            let resAction = await PostModel.getDataById(idPost,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let editPost = resAction.data;
            
            let queryReply = null;
            if(idReply!=null){
                //check exist reply
                resAction = await CommentModel.getDataById(idReply,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return;
                }
                if(queryReply.Post.toString()!=idPost){
                    //is not a Comment of this post
                    res.json(Controller.Fail(Messages(req.lang,'permissions_denied_action')));
                    return;
                }
                queryReply = resAction.data;
            }

            let newComment = new CommentModel();
            newComment.Content=content;
            newComment.WasDeleted=false;
            newComment.Post = idPost; 
            newComment.Author=idAccount;
            newComment.Time= Date.now();
            if(queryReply==null){
                newComment.ParentReply=null;
                newComment.Level=0;
            }else{
                newComment.ParentReply=idReply;
                newComment.Level=queryReply.Level+1;
            }
            newComment.UsersLike=[]
            newComment.ChildsReply=[]

            resAction = await CommentModel.createComment(newComment,req.lang);
            let newCommentId = resAction.data.id;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            if(queryReply!=null){
                //update reply comment
                let updateFields = {$set:{
                    ChildsreplyNumber:queryReply.ChildsreplyNumber++
                }};
    
                resAction = await CommentModel.updateComment(idReply, updateFields,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));   
                    return;
                } else {
                    res.json(Controller.Success({ tags: tags}));  
                    return;
                }
            }
            //update post comments number
            let resUpdatePost = PostController.inscreaseCommentNumbers(req,editPost);

            //get return new comment
            resAction = await CommentModel.getDataById(newCommentId,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let newCommentRes = new CommentResponse.Comment(
                resAction.data._id.toString(),
                resAction.data.WasDeleted,
                resAction.data.Content,
                resAction.data.Post.toString(),
                resAction.data.Author._id.toString(),
                resAction.data.Author.Name,
                resAction.data.Author.Avatar,
                resAction.data.Time,
                resAction.data.ParentReply.toString(),
                resAction.data.Level,
                0,
                false,
                0,
                false,
                true,
            );

            res.json(Controller.Success(newCommentRes));  
        }  
        catch (error) {  
            console.log(error)
            res.json(Controller.Fail(Messages(req.lang, "system_error")));  
        }  
    },
    //http post, authen
    UserInteract : async function(req,res){  
        try {  
            let idAccount = req.user.id;

            let status = req.body.status;
            let commentId = req.body.comment_id;
            
            if (postId == undefined || postId == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            if (status !== USER_INTERACT_REQUEST_STATUS.Like && status !== USER_INTERACT_REQUEST_STATUS.Delete) {
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }

            let resAction = await CommentModel.getDataById(commentId,req.lang);
            let editComment = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            let updateFields=null;
            let resObject = new CommentResponse.CommentUpdateInteractResponse();
            //  = {$set:{Name:editChanelChat.Name,LastTimeAction:editChanelChat.LastTimeAction}};
            
            if(status===USER_INTERACT_REQUEST_STATUS.Like){
                //toggle user like
                let ind = editComment.UsersLike.findIndex(e => e.toString()==idAccount);
                if (ind == -1) {
                    editComment.UsersLike.push(idAccount);
                    resObject.status = CommentResponse.CommentUpdateInteractResponseStatus.Liked;
                } else {
                    editComment.UsersLike.splice(ind, 1);
                    resObject.status = CommentResponse.CommentUpdateInteractResponseStatus.Unliked;
                }
                resObject.totalNumber = editComment.UsersLike.length;
                updateFields = {$set:{UsersLike:editComment.UsersLike}};
            }else{
                //delete
                if(editComment.Author._id.toString()!=idAccount){
                    //not owner
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return;
                }
                updateFields = {$set:{WasDeleted:true}};
                resObject.status = CommentResponse.CommentUpdateInteractResponseStatus.Deleted;
            }
                
            if(updateFields==null){
                res.json(Controller.Fail(Message(req.lang,"system_error")));  
                return;
            }

            //update post
            resAction = await CommentModel.updateComment(editComment._id, updateFields,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            }
            resObject.isComplete=true;
            res.json(Controller.Success(resObject));   
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    
}  

module.exports = CommentController;