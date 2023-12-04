const Messages = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var PostModel = require('../models/PostModel');  
var CommentModel = require('../models/CommentModel');  
var Controller = require('./Controller');
var Auth = require('../core/Auth');  
var PostController = require('./PostController');
const CommentResponse = require("../client_data_response_models/Comment");
const NegativeWord = require('./Tool/NegativeWord');
const NotificationTool = require("./Tool/Notification");


const LIMIT_COMMENTS_PER_RESQUEST = 6;
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
                    comment.ParentReply==null?null:comment.ParentReply.toString(),
                    comment.Level,
                    comment.UsersLike.length,
                    idAccount!=undefined&&comment.UsersLike.findIndex(e=>e.toString()==idAccount)!=-1,
                    comment.ChildsReplyNumber,
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
            let nameAccount = req.user.userData.name;

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

            //filter negative words
            content = NegativeWord.filterString(content);

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
                queryReply = resAction.data;
                if(queryReply.Post._id.toString()!=idPost){
                    //is not a Comment of this post
                    res.json(Controller.Fail(Messages(req.lang,'permissions_denied_action')));
                    return;
                }
                
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
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let newCommentId = resAction.data.id;
            if(queryReply!=null){
                //update reply comment
                // console.log(queryReply.ChildsReplyNumber);
                let updateFields = {$set:{
                    ChildsReplyNumber:queryReply.ChildsReplyNumber+1
                }};
                
                resAction = await CommentModel.updateComment(idReply, updateFields,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));   
                    return;
                }
            }
            //update post comments number
            let resUpdatePost = await PostController.inscreaseCommentNumbers(req,editPost);

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
                resAction.data.Post._id.toString(),
                resAction.data.Author._id.toString(),
                resAction.data.Author.Name,
                resAction.data.Author.Avatar,
                resAction.data.Time,
                resAction.data.ParentReply==null?null:resAction.data.ParentReply.toString(),
                resAction.data.Level,
                0,
                false,
                0,
                false,
                true,
            );
            //notification
            let receiveUserNotificationIds=editPost.UsersFollow.map(e=>e.User.toString());
            receiveUserNotificationIds=receiveUserNotificationIds.filter(e=>e!=idAccount);
            NotificationTool.Post.usersCommentPost(
                req,receiveUserNotificationIds,
                idAccount,nameAccount,editPost._id.toString(),editPost.Content);

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
            
            if (commentId == undefined || commentId == "") {
                res.json(Controller.Fail(Messages(req.lang, "system_error")));
                return; 
            }

            if (status !== USER_INTERACT_REQUEST_STATUS.Like && status !== USER_INTERACT_REQUEST_STATUS.Delete) {
                res.json(Controller.Fail(Messages(req.lang, "system_error")));  
                return;
            }

            let resAction = await CommentModel.getDataById(commentId,req.lang);
            let editComment = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let resObject = new CommentResponse.CommentUpdateInteractResponse();
                
            if(!editComment.WasDeleted){
                let updateFields=null;
                
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
                        resAction = await PostModel.getDataById(editComment.Post._id.toString(),req.lang);
                        if (resAction.status == ModelResponse.ResStatus.Fail) {
                            res.json(Controller.Fail(resAction.error));
                            return;
                        }
                        let queryPost = resAction.data.toObject();

                        let isOwner = false;
                        if (
                            (queryPost.AuthorType == PostModel.AuthorType.Team && queryPost.Team.Leader.toString() != idAccount)
                            ||(queryPost.AuthorType == PostModel.AuthorType.Project && queryPost.Project.Leader.toString() != idAccount)
                            ||(queryPost.AuthorType == PostModel.AuthorType.User && queryPost.User._id.toString() != idAccount)
                            ) {
                            //check is leader
                            res.json(Controller.Fail(Messages(req.lang,'permissions_denied_action')));
                            return;
                        }
                    }
                    updateFields = {$set:{WasDeleted:true}};
                    resObject.status = CommentResponse.CommentUpdateInteractResponseStatus.Deleted;
                }
                    
                if(updateFields==null){
                    res.json(Controller.Fail(Messages(req.lang,"system_error")));  
                    return;
                }

                //update post
                resAction = await CommentModel.updateComment(editComment._id, updateFields,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));   
                    return;
                }
            }else{
                resObject.status = CommentResponse.CommentUpdateInteractResponseStatus.Deleted;
            }
            resObject.isComplete=true;
            res.json(Controller.Success(resObject));   
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Messages(req.lang,"system_error")));   
        }  
    },
    
}  

module.exports = CommentController;