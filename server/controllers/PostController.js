const ViewAlert = require('../view_models/ViewAlert');
const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var TeamModel = require('../models/TeamModel');  
var ProjectModel = require('../models/ProjectModel');  
var CategoryKeywordModel = require('../models/CategoryKeywordModel');  
var AccountModel = require('../models/AccountModel');  
var PostModel = require('../models/PostModel');
var Auth = require('../core/Auth');  
const Mail = require('../core/Mail');
var Controller = require('./Controller');
const PostResponse = require("../client_data_response_models/Post");
const Path = require('path');

const GET_LIST_LIMIT_POSTS = 20;

const GET_LIST_FILTER = {
    Guest:"guest",
    Team:"team",
    Project:"project",
    User:"user",
    UserSaved:"user_saved",
    UserLiked:"user_liked",
    UserFollowed:"user_followed",
}

//containt the function with business logics  
var PostController = {  
    
    //http post, authen
    Create : async function(req,res){  
        try {  
            console.log(req.body)
            let idAccount = req.user.id;
            let creatorType = req.body.creator_type;
            let creatorId = req.body.creator_id;
            let content = req.body.content;
            let categoryKeywordsId = JSON.parse(req.body.keywords)||[];

            if (!Controller.isStringArray(categoryKeywordsId)) {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            if (creatorType != PostModel.AuthorType.Team && creatorType != PostModel.AuthorType.User && creatorType != PostModel.AuthorType.Project) {
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }
            if(creatorType == PostModel.AuthorType.Team || creatorType == PostModel.AuthorType.Project){
                if (creatorId == undefined || creatorId == "") {
                    res.json(Controller.Fail(Message(req.lang, "system_error")));
                    return; 
                }
            }
            if (content == undefined || content == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }
            //valid
            let contentValid = PostModel.isValidContent(content, req.lang);
            if (!contentValid.isValid) {
                res.json(Controller.Fail(contentValid.error));
                return;
            }

            
            let resAction;
            //check category keywords
            resAction = await CategoryKeywordModel.getAllCategoryKeywordsByUser(req.lang);
            let allKeywords = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            
            //get valid category keyword
            let validCategoryKeywordsId = [];
            categoryKeywordsId.forEach(id => {
                let ind = allKeywords.findIndex(e=>e._id.toString()==id);
                if(ind!=-1){
                    validCategoryKeywordsId.push(id);
                }
            });

            //check is leader
            if (creatorType == PostModel.AuthorType.Team) {
                //check team exist
                resAction = await TeamModel.getDataById(creatorId, req.lang);
                let queryTeam = resAction.data;
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return;
                }
                //check is leader
                if (queryTeam.Leader.toString() != idAccount) {
                    //not leader
                    res.json(Controller.Fail(Message(req.lang, 'permissions_denied_action')));
                    return;
                }
            }else if (creatorType == PostModel.AuthorType.Project) {
                //check team exist
                resAction = await ProjectModel.getDataById(creatorId, req.lang);
                let queryProject = resAction.data;
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return;
                }
                //check is leader
                if (queryProject.Leader.toString() != idAccount) {
                    //not leader
                    res.json(Controller.Fail(Message(req.lang, 'permissions_denied_action')));
                    return;
                }
            }
            
            //get images
            let createImagesPath = [];
            let validUploadedImageNumber = 0;
            let uploadedImageCount = 0;
            //upload image
            if (req.files && Object.keys(req.files).length !== 0) {
                uploadedImageCount = Object.keys(req.files).length;

                let images = req.files.images;

                // If 'images' is a single file, convert it to an array
                let imageArray = Array.isArray(images) ? images : [images];

                let fullPath = Path.join(__dirname,'..','public','images','posts');
                console.log(imageArray);
                // Process each uploaded file
                imageArray.forEach((image, index) => {
                    if (!image.mimetype.startsWith('image/')) {

                    } else {
                        validUploadedImageNumber++;
                        if(validUploadedImageNumber>PostModel.MAXIMUM_IMAGES_COUNT){
                            return;
                            //maximun images number of one post
                        }
                        let imageName = Date.now()+"."+idAccount+"."+validUploadedImageNumber +"."+ image.name;
                        image.mv(Path.join(fullPath, imageName));
                        createImagesPath.push(imageName);
                    }
                });
                
            }
            
            //create
            let postObject = PostModel.PostObject();
            postObject.AuthorType=creatorType;
            postObject.Content= content;
            if(creatorType==PostModel.AuthorType.Project){
                postObject.Project = creatorId;
            }else if(creatorType==PostModel.AuthorType.Team){
                postObject.Team = creatorId;
            }else {
                postObject.User = creatorId;
            }
            postObject.PostTime=Date.now();
            postObject.Images=createImagesPath;
            postObject.CategoryKeywords=validCategoryKeywordsId;

            resAction = await PostModel.createPost(postObject,req.lang); 
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            } else {
                res.json(Controller.Success({ newPostId:resAction.data.id,isComplete:true,uploadImageResult:""+validUploadedImageNumber+"/"+uploadedImageCount }));
                return;
            }
            
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //http get
    GetList : async function(req,res){  
        try {  
            let idAccount = undefined;
            let account = await Auth.CheckAndGetAuthenUser(req);
            if (account != false) { 
                idAccount = account.id;
            }

            let filter = req.query.filter;
            let authorId=req.query.author_id;

            let timePrivious = req.query.time;
            if (timePrivious == undefined || timePrivious == 0) timePrivious = Date.now();

            if (filter !== GET_LIST_FILTER.Guest 
                && filter !== GET_LIST_FILTER.Project 
                && filter !== GET_LIST_FILTER.Team
                && filter !== GET_LIST_FILTER.User
                && filter !== GET_LIST_FILTER.UserSaved
                && filter !== GET_LIST_FILTER.UserLiked
                && filter !== GET_LIST_FILTER.UserFollowed){
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }
            if (filter !== GET_LIST_FILTER.Project 
                && filter !== GET_LIST_FILTER.Team
                && filter !== GET_LIST_FILTER.User){
                if (authorId == undefined || authorId == "") {
                    res.json(Controller.Fail(Message(req.lang, "system_error")));
                    return; 
                }
            }
            

            let resAction;

            let isOwner = false;
            if (filter == GET_LIST_FILTER.Team) {
                //check team exist
                resAction = await TeamModel.getDataById(authorId,req.lang);
                let queryTeam = resAction.data;
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return;
                }
                //check is leader
                if (idAccount!==undefined && queryTeam.Leader.toString() == idAccount) {
                    isOwner = true;
                }
            }else if (filter == GET_LIST_FILTER.Project) {
                //check project exist
                resAction = await ProjectModel.getDataById(authorId,req.lang);
                let queryProject = resAction.data;
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return;
                }
                //check is leader
                if (idAccount!==undefined && queryProject.Leader.toString() == idAccount) {
                    isOwner = true;
                }
            }else if (filter == GET_LIST_FILTER.User) {
                //check team exist
                resAction = await AccountModel.getDataById(authorId,req.lang);
                let queryAccount = resAction.data;
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return;
                }
                //check is mine
                if (idAccount!==undefined && queryAccount._id.toString() == idAccount) {
                    isOwner = true;
                }
            }else if(filter == GET_LIST_FILTER.UserSaved || filter == GET_LIST_FILTER.UserFollowed || filter == GET_LIST_FILTER.UserLiked){
                //lot login
                if (idAccount === undefined) {
                    res.json(Controller.Fail(Message(req.lang, "system_error"),403));
                    return;
                }
            }

            let condition;
            let populateUser = {
                path: 'User',
                select: '_id Name Avatar'
            };
            let populateTeam = {
                path: 'Team',
                select: '_id Name Avatar Leader'
            };
            let populateProject = {
                path: 'Project',
                select: '_id Name Avatar Leader'
            };

            if (filter == GET_LIST_FILTER.Guest) {
                condition = {
                    IsActive:true,
                    PostTime: {$lt:timePrivious}
                }
            }else if (filter == GET_LIST_FILTER.Team){
                //team
                if (isOwner) {
                    condition = {
                        AuthorType: PostModel.AuthorType.Team,
                        Team:authorId,
                        PostTime: {$lt:timePrivious}
                    }
                } else {
                    condition = {
                        AuthorType: PostModel.AuthorType.Team,
                        Team:authorId,
                        IsActive:true,
                        PostTime: {$lt:timePrivious}
                    }
                }
            }else if (filter == GET_LIST_FILTER.Project){
                //team
                if (isOwner) {
                    condition = {
                        AuthorType: PostModel.AuthorType.Project,
                        Project:authorId,
                        PostTime: {$lt:timePrivious}
                    }
                } else {
                    condition = {
                        AuthorType: PostModel.AuthorType.Project,
                        Project:authorId,
                        IsActive:true,
                        PostTime: {$lt:timePrivious}
                    }
                }
            }else if (filter == GET_LIST_FILTER.User){
                //team
                if (isOwner) {
                    condition = {
                        AuthorType: PostModel.AuthorType.User,
                        User:authorId,
                        PostTime: {$lt:timePrivious}
                    }
                } else {
                    condition = {
                        AuthorType: PostModel.AuthorType.User,
                        User:authorId,
                        IsActive:true,
                        PostTime: {$lt:timePrivious}
                    }
                }
            }else if (filter == GET_LIST_FILTER.UserSaved){
                condition = {
                    IsActive:true,
                    'UsersSave.User':{$in:[idAccount]}
                }
            }else if (filter == GET_LIST_FILTER.UserLiked){
                condition = {
                    IsActive:true,
                    'UsersLike.User':{$in:[idAccount]}
                }
            }else if (filter == GET_LIST_FILTER.UserFollowed){
                condition = {
                    IsActive:true,
                    'UsersFollow.User':{$in:[idAccount]}
                }
            }else {
                res.json(Controller.Fail(Message(req.lang,"system_error")));   
                return;
            }

            let queryPosts;
            if (filter == "user_save") {
                queryPosts = await PostModel.find(condition).populate(populateTeam).populate(populateAccount);
            } else {
                queryPosts = await PostModel.find(condition).sort({PostTime:-1}).populate(populateTeam).populate(populateAccount).limit(GET_LIST_LIMIT_POSTS+1);
            }
            //convert query result to object
            queryPosts = queryPosts.map(post => post.toObject());
            
            if (filter == "user_save") {
                //filter of filter user_save
                queryPosts.forEach(e => {
                    let saveUser = e.UsersSave.find(fe => fe.User==idAccount && fe.SaveTime < timePrivious);
                    if (saveUser == undefined) {
                        e.SaveTime = -1;
                    } else {
                        e.SaveTime = saveUser.SaveTime;
                    }
                })
                //filter query elements if post has UserSave is this account
                queryPosts = queryPosts.filter(fe => fe.SaveTime != -1);
                
                //sort descreen
                // a>b => [b,a]
                queryPosts.sort((a, b) => b.SaveTime - a.SaveTime);
                //get limit
                if (queryPosts.length > GET_LIST_LIMIT_POSTS + 1)
                    queryPosts.splice(GET_LIST_LIMIT_POSTS+1)
            }

            let isFinish;
            let timePrevious;
            if (queryPosts.length == 0) {
                isFinish = true;
                timePrevious = 0;
            } else {
                isFinish = queryPosts.length != GET_LIST_LIMIT_POSTS + 1;
                if (!isFinish) queryPosts.splice(GET_LIST_LIMIT_POSTS, 1);
                if (filter == "user_save") {
                    timePrevious = queryPosts[queryPosts.length - 1].SaveTime;
                } else {
                    timePrevious = queryPosts[queryPosts.length - 1].PostTime;
                }
            }

            let responsePosts = [];
            let wasSaved = false;
            queryPosts.forEach(e => {
                if (filter == "user_save") {
                    wasSaved = true;
                } else if (idAccount == undefined) { 
                    wasSaved = false;
                }else{
                    wasSaved = e.UsersSave.find(fe => fe.User == idAccount) !== undefined;
                }
                if (e.AuthorType == PostModel.AuthorType.Team) {
                    responsePosts.push(new PostResponse.Post(
                        e.Team.Avatar,
                        e.Team.Name,
                        e.Team._id,
                        e._id,
                        e.AuthorType,
                        e.PostTime,
                        (filter=="user_save")?e.SaveTime:0,
                        e.Content,
                        e.Images,
                        e.IsActive,
                        wasSaved,
                        (e.Team.Leader.toString()==idAccount)?PostResponse.Relationship.Owner:PostResponse.Relationship.Guest,
                    ));
                } else {
                    responsePosts.push(new PostResponse.Post(
                        e.User.Avatar,
                        e.User.Name,
                        e.User._id,
                        e._id,
                        e.AuthorType,
                        e.PostTime,
                        (filter=="user_save")?e.SaveTime:0,
                        e.Content,
                        e.Images,
                        e.IsActive,
                        wasSaved,
                        (e.User._id.toString()==idAccount)?PostResponse.Relationship.Owner:PostResponse.Relationship.Guest,
                    ));
                }
                
            });
            
            res.json(Controller.Success(new PostResponse.PostsListObject(
                responsePosts,
                timePrevious,
                isFinish,
                idAccount!==undefined
            )));  
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    
    //http post, authen
    UserInterRact : async function(req,res){  
        try {  
            let idAccount = req.user.id;

            let status = req.body.status;
            let postId = req.body.post_id;
            
            if (postId == undefined || postId == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            if (status !== "save" && status !== "follow" && status !== "like") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }

            let resAction = await PostModel.getDataById(postId,req.lang);
            let editPost = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }

            let updateFields=null;
            let resObject = new PostResponse.PostUpdateInteractResponse();
            //  = {$set:{Name:editChanelChat.Name,LastTimeAction:editChanelChat.LastTimeAction}};
            
            if(status==="save"){
                //toggle user save
                let ind = editPost.UsersSave.findIndex(e => e.User==idAccount);
                if (ind == -1) {
                    let userSaveObject = new PostModel.UserSaveObject();
                    userSaveObject.User = idAccount;
                    userSaveObject.Time = Date.now();
                    editPost.UsersSave.push(userSaveObject);
                    resObject.status = PostResponse.PostUpdateInteractResponseStatus.Saved;
                } else {
                    editPost.UsersSave.splice(ind, 1);
                    resObject.status = PostResponse.PostUpdateInteractResponseStatus.Unsaved;
                }
                updateFields = {$set:{UsersSave:editPost.UsersSave}};
            }else if(status==="follow"){
                //toggle user save
                let ind = editPost.UsersFollow.findIndex(e => e.User==idAccount);
                if (ind == -1) {
                    let userSaveObject = new PostModel.UserSaveObject();
                    userSaveObject.User = idAccount;
                    userSaveObject.Time = Date.now();
                    editPost.UsersFollow.push(userSaveObject);
                    resObject.status = PostResponse.PostUpdateInteractResponseStatus.Followed;
                } else {
                    editPost.UsersFollow.splice(ind, 1);
                    resObject.status = PostResponse.PostUpdateInteractResponseStatus.Unfollowed;
                }
                updateFields = {$set:{UsersFollow:editPost.UsersFollow}};
            }else if(status==="like"){
                //toggle user save
                let ind = editPost.UsersLike.findIndex(e => e.User==idAccount);
                if (ind == -1) {
                    let userSaveObject = new PostModel.UserSaveObject();
                    userSaveObject.User = idAccount;
                    userSaveObject.Time = Date.now();
                    editPost.UsersLike.push(userSaveObject);
                    resObject.status = PostResponse.PostUpdateInteractResponseStatus.Liked;
                } else {
                    editPost.UsersLike.splice(ind, 1);
                    resObject.status = PostResponse.PostUpdateInteractResponseStatus.Unliked;
                }
                resObject.totalNumber = editPost.UsersLike.length;
                updateFields = {$set:{UsersLike:editPost.UsersLike}};
            }
                
            if(updateFields==null){
                res.json(Controller.Fail(Message(req.lang,"system_error")));  
                return;
            }

            //update post
            resAction = await PostModel.updatePost(editPost._id, updateFields,req.lang);
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

    //http post, authen
    OwnerUpdate : async function(req,res){  
        try {  
            let idAccount = req.user.id;

            let status = req.body.status;
            let postId = req.body.post_id;
            
            if (postId == undefined || postId == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            if (status !== "active" && status !== "save" && status !== "follow" && status !== "like") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }

            let resAction = await PostModel.getDataById(postId,req.lang);
            let editPost = resAction.data;
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            if (status == "active") {
                //only owner set activeable
                if (editPost.AuthorType == PostModel.AuthorType.Team) {
                    //team
                    teamId = editPost.Team;
                    resAction = await TeamModel.getDataById(teamId,req.lang);
                    let queryTeam = resAction.data;
                    //check team exist
                    if (resAction.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(resAction.error));
                        return;
                    }
                    //check is leader
                    if (queryTeam.Leader.toString() != idAccount) {
                        //not leader
                        res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                        return; 
                    }
                } else {
                    //user
                    //check user own post
                    if (editPost.User.toString() != idAccount) {
                        res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                        return; 
                    }
                }
                editPost.IsActive = !editPost.IsActive;

            } else {
                //set save
                let indexSaveUser = editPost.UsersSave.findIndex(fe => fe.User==idAccount);
                if (indexSaveUser == -1) {
                    editPost.UsersSave.push({ User: idAccount, SaveTime: Date.now() });
                } else {
                    editPost.UsersSave.splice(indexSaveUser, 1);
                }
            }

            //update post
            resAction = await PostModel.updatePost(editPost._id, editPost,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));   
                return;
            }
            res.json(Controller.Success({isComplete:true}));   
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },

}  
  
module.exports = PostController;