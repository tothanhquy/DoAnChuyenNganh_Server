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
const NotificationTool = require("./Tool/Notification");
const LogTool = require("./Tool/Log");


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
        let imagesPathDeleteCaseOfError = [];
        let fullPath = "";
        try {
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

            let projectName;
            let receiveUserNotificationIds;
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
                //check project exist
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
                projectName = queryProject.Name;
                receiveUserNotificationIds=queryProject.UserFollows.map(e=>e.toString());
                receiveUserNotificationIds=receiveUserNotificationIds.filter(e=>e!=idAccount);
                    
            }else{

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

                fullPath = Path.join(__dirname,'..','public','images','posts');
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
                        let imageName = Date.now()+"."+Controller.generateRandomString(10) +"."+ image.name;
                        image.mv(Path.join(fullPath, imageName));
                        createImagesPath.push(imageName);
                        imagesPathDeleteCaseOfError.push(imageName);
                    }
                });
            }
            
            //create
            let postObject = new PostModel.PostObject();
            postObject.AuthorType=creatorType;
            postObject.Content= content;
            if(creatorType==PostModel.AuthorType.Project){
                postObject.Project = creatorId;
            }else if(creatorType==PostModel.AuthorType.Team){
                postObject.Team = creatorId;
            }else {
                postObject.User = idAccount;
            }
            postObject.PostTime=Date.now();
            postObject.Images=createImagesPath;
            postObject.CategoryKeywords=validCategoryKeywordsId;

            resAction = await PostModel.createPost(postObject,req.lang); 
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                //delete image uploaded
                imagesPathDeleteCaseOfError.forEach(path=>{
                    if(Controller.isExistPath(Path.join(fullPath,path))){
                        Controller.deleteFile(Path.join(fullPath,path));
                    }
                });
                return;
            } else {
                //notification
                if (creatorType == PostModel.AuthorType.Project){
                    NotificationTool.Post.projectCreateNewPost(
                        req,receiveUserNotificationIds,
                        resAction.data.id,creatorId,projectName);
                }

                res.json(Controller.Success({ newPostId:resAction.data.id,isComplete:true,uploadImageResult:""+validUploadedImageNumber+"/"+uploadedImageCount }));
                return;
            }
            
        }  
        catch (error) {  
            console.log(error);
            //delete image uploaded
            imagesPathDeleteCaseOfError.forEach(path=>{
                if(Controller.isExistPath(Path.join(fullPath,path))){
                    Controller.deleteFile(Path.join(fullPath,path));
                }
            });
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
            if (filter == GET_LIST_FILTER.Project 
                || filter == GET_LIST_FILTER.Team
                || filter == GET_LIST_FILTER.User){
                if (authorId == undefined || authorId == "") {
                    res.json(Controller.Fail(Message(req.lang, "system_error")));
                    return; 
                }
            }
            
            let resAction;

            let isLoadInactivePost = false;
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
                    isLoadInactivePost = true;
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
                    isLoadInactivePost = true;
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
                    isLoadInactivePost = true;
                }
            }else if(filter == GET_LIST_FILTER.UserSaved || filter == GET_LIST_FILTER.UserFollowed || filter == GET_LIST_FILTER.UserLiked){
                //lot login
                if (idAccount === undefined) {
                    console.log(2)
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
                    PostTime: {$lte:timePrivious}
                }
            }else if (filter == GET_LIST_FILTER.Team){
                //team
                if (isLoadInactivePost) {
                    condition = {
                        AuthorType: PostModel.AuthorType.Team,
                        Team:authorId,
                        PostTime: {$lte:timePrivious}
                    }
                } else {
                    condition = {
                        AuthorType: PostModel.AuthorType.Team,
                        Team:authorId,
                        IsActive:true,
                        PostTime: {$lte:timePrivious}
                    }
                }
            }else if (filter == GET_LIST_FILTER.Project){
                if (isLoadInactivePost) {
                    condition = {
                        AuthorType: PostModel.AuthorType.Project,
                        Project:authorId,
                        PostTime: {$lte:timePrivious}
                    }
                } else {
                    condition = {
                        AuthorType: PostModel.AuthorType.Project,
                        Project:authorId,
                        IsActive:true,
                        PostTime: {$lte:timePrivious}
                    }
                }
            }else if (filter == GET_LIST_FILTER.User){
                if (isLoadInactivePost) {
                    condition = {
                        AuthorType: PostModel.AuthorType.User,
                        User:authorId,
                        PostTime: {$lte:timePrivious}
                    }
                } else {
                    condition = {
                        AuthorType: PostModel.AuthorType.User,
                        User:authorId,
                        IsActive:true,
                        PostTime: {$lte:timePrivious}
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
            if(filter==GET_LIST_FILTER.Guest||filter==GET_LIST_FILTER.Team||filter==GET_LIST_FILTER.Project||filter==GET_LIST_FILTER.User){
                queryPosts = await PostModel.find(condition).sort({PostTime:-1}).populate(populateTeam).populate(populateUser).populate(populateProject).limit(GET_LIST_LIMIT_POSTS+1);
            }else{
                queryPosts = await PostModel.find(condition).populate(populateTeam).populate(populateUser).populate(populateProject);
            }
            //convert query result to object
            queryPosts = queryPosts.map(post => post.toObject());
            
            let userSaved;
            let userLiked;
            let userFollowed;
            queryPosts.forEach(post => {
                userSaved=undefined;
                userLiked=undefined;
                userFollowed=undefined;
                if(idAccount!=undefined){
                    //login
                    userSaved= post.UsersSave.find(us => us.User.toString()==idAccount && us.Time < timePrivious);
                    userLiked= post.UsersLike.find(ul => ul.User.toString()==idAccount && ul.Time < timePrivious);
                    userFollowed = post.UsersFollow.find(uf => uf.User.toString()==idAccount && uf.Time < timePrivious);
                }
                
                post.UserSavedTime = userSaved==undefined?0:userSaved.Time;
                post.UserLikedTime = userLiked==undefined?0:userLiked.Time;
                post.UserFollowedTime = userFollowed==undefined?0:userFollowed.Time;
                if(filter == GET_LIST_FILTER.UserSaved){
                    post.SortTime = post.UserSavedTime;
                }else if(filter == GET_LIST_FILTER.UserLiked){
                    post.SortTime = post.UserLikedTime;
                }else if(filter == GET_LIST_FILTER.UserFollowed){
                    post.SortTime = post.UserFollowedTime;
                }else{
                    post.SortTime = 0;
                }
            })
            if (filter == GET_LIST_FILTER.UserSaved || filter == GET_LIST_FILTER.UserLiked || filter == GET_LIST_FILTER.UserFollowed) {
                //filter query elements if post has UserSave is this account
                queryPosts = queryPosts.filter(p => p.SortTime != 0);
                
                //sort descreen
                // a>b => [b,a]
                queryPosts.sort((a, b) => b.SortTime - a.SortTime);
                //get limit
                if (queryPosts.length > GET_LIST_LIMIT_POSTS + 1)
                    queryPosts.splice(-(queryPosts.length-(GET_LIST_LIMIT_POSTS+1)));
            }

            let resObject = new PostResponse.PostsListObject();
            if(idAccount==undefined){
                //not login
                resObject.isActionable=false;
            }else{
                resObject.isActionable=true;
            }
            if (queryPosts.length == 0) {
                resObject.isFinish = true;
                resObject.timePrevious = 0;
            } else {
                resObject.isFinish = queryPosts.length != GET_LIST_LIMIT_POSTS + 1;
                if (!resObject.isFinish) queryPosts.splice(GET_LIST_LIMIT_POSTS, 1);
                if (filter == GET_LIST_FILTER.UserSaved || filter == GET_LIST_FILTER.UserLiked || filter == GET_LIST_FILTER.UserFollowed) {
                    resObject.timePrevious = queryPosts[queryPosts.length - 1].UserSaveTime;
                } else {
                    resObject.timePrevious = queryPosts[queryPosts.length - 1].PostTime;
                }
            }

            queryPosts.forEach(post => {
                let newPost = new PostResponse.PostListItem();
                if(post.AuthorType == PostModel.AuthorType.User){
                    newPost.authorAvatar=post.User.Avatar;
                    newPost.authorName=post.User.Name;
                    newPost.authorId=post.User._id.toString();
                    newPost.authorType=PostResponse.AuthorType.User;
                    newPost.isOwner = idAccount!=undefined&&post.User._id.toString()==idAccount?true:false;
                }else if(post.AuthorType == PostModel.AuthorType.Team){
                    newPost.authorAvatar=post.Team.Avatar;
                    newPost.authorName=post.Team.Name;
                    newPost.authorId=post.Team._id.toString();
                    newPost.authorType=PostResponse.AuthorType.Team;
                    newPost.isOwner = idAccount!=undefined&&post.Team.Leader.toString()==idAccount?true:false;
                }else if(post.AuthorType == PostModel.AuthorType.Project){
                    newPost.authorAvatar=post.Project.Avatar;
                    newPost.authorName=post.Project.Name;
                    newPost.authorId=post.Project._id.toString();
                    newPost.authorType=PostResponse.AuthorType.Project;
                    newPost.isOwner = idAccount!=undefined&&post.Project.Leader.toString()==idAccount?true:false;
                }else{
                    newPost.authorAvatar="";
                    newPost.authorName="";
                    newPost.authorId="";
                    newPost.authorType=PostResponse.AuthorType.User;
                }
                
                newPost.postId=post._id.toString();
                newPost.postTime=post.PostTime;
                newPost.lastEditTime=post.LastEditTime;
                newPost.content=post.Content;
                newPost.images=post.Images;
                newPost.isActive=post.IsActive;
                newPost.relationship=newPost.isOwner?PostResponse.Relationship.Owner:PostResponse.Relationship.Guest;
                newPost.wasSaved=post.UserSavedTime!=0?true:false;
                newPost.savedTime=post.UserSavedTime;
                newPost.likeNumber=post.UsersLike.length;
                newPost.wasLiked=post.UserLikedTime!=0?true:false;
                newPost.likedTime=post.UserlikedTime;
                newPost.wasFollowed=post.UserFollowedTime!=0?true:false;
                newPost.followedTime=post.UserFollowedTime;
                newPost.commentsNumber=post.CommentsNumber;
                
                resObject.posts.push(newPost);
            });
            
            res.json(Controller.Success(resObject));  
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
            let nameAccount = req.user.userData.name;

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

            //notification
            if(resObject.status == PostResponse.PostUpdateInteractResponseStatus.Liked){
                let receiveUserNotificationIds=editPost.UsersFollow.map(e=>e.User.toString());
                receiveUserNotificationIds=receiveUserNotificationIds.filter(e=>e!=idAccount);
                NotificationTool.Post.usersLikePost(
                    req,receiveUserNotificationIds,
                    idAccount,nameAccount,postId,editPost.Content);
            }

            res.json(Controller.Success(resObject));   
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },

    //http get
    Details : async function(req,res){  
        try {  
            let idAccount = undefined;
            let account = await Auth.CheckAndGetAuthenUser(req);
            if (account != false) { 
                idAccount = account.id;
            }

            let postId=req.query.id;

            if (postId == undefined || postId == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await PostModel.getDataById(postId,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let queryPost = resAction.data.toObject();

            let isOwner = false;
            if (queryPost.AuthorType == PostModel.AuthorType.Team) {
                //check is leader
                if (idAccount!==undefined && queryPost.Team.Leader.toString() == idAccount) {
                    isOwner = true;
                }
            }else if (queryPost.AuthorType == PostModel.AuthorType.Project) {
                //check is leader
                if (idAccount!==undefined && queryPost.Project.Leader.toString() == idAccount) {
                    isOwner = true;
                }
            }else if (queryPost.AuthorType == PostModel.AuthorType.User) {
                //check is mine
                if (idAccount!==undefined && queryPost.User._id.toString() == idAccount) {
                    isOwner = true;
                }
            }

            let userSaved=undefined;
            let userLiked=undefined;
            let userFollowed=undefined;
            if(idAccount!=undefined){
                //login
                userSaved= queryPost.UsersSave.find(us => us.User.toString()==idAccount);
                userLiked= queryPost.UsersLike.find(ul => ul.User.toString()==idAccount);
                userFollowed = queryPost.UsersFollow.find(uf => uf.User.toString()==idAccount);
            }
            
            queryPost.UserSavedTime = userSaved==undefined?0:userSaved.Time;
            queryPost.UserLikedTime = userLiked==undefined?0:userLiked.Time;
            queryPost.UserFollowedTime = userFollowed==undefined?0:userFollowed.Time;
            
            let resObject = new PostResponse.PostsListObject();
            if(idAccount==undefined){
                //not login
                resObject.isActionable=false;
            }else{
                resObject.isActionable=true;

                //system log
                LogTool.Post.detailsVisit(idAccount, postId);
            }
            
            let newPost = new PostResponse.PostListItem();
            if(queryPost.AuthorType == PostModel.AuthorType.User){
                newPost.authorAvatar=queryPost.User.Avatar;
                newPost.authorName=queryPost.User.Name;
                newPost.authorId=queryPost.User._id.toString();
                newPost.authorType=PostResponse.AuthorType.User;
                newPost.isOwner = idAccount!=undefined&&queryPost.User._id.toString()==idAccount?true:false;

            }else if(queryPost.AuthorType == PostModel.AuthorType.Team){
                newPost.authorAvatar=queryPost.Team.Avatar;
                newPost.authorName=queryPost.Team.Name;
                newPost.authorId=queryPost.Team._id.toString();
                newPost.authorType=PostResponse.AuthorType.Team;
                newPost.isOwner = idAccount!=undefined&&queryPost.Team.Leader.toString()==idAccount?true:false;

            }else if(queryPost.AuthorType == PostModel.AuthorType.Project){
                newPost.authorAvatar=queryPost.Project.Avatar;
                newPost.authorName=queryPost.Project.Name;
                newPost.authorId=queryPost.Project._id.toString();
                newPost.authorType=PostResponse.AuthorType.Project;
                newPost.isOwner = idAccount!=undefined&&queryPost.Project.Leader.toString()==idAccount?true:false;
            }else{
                newPost.authorAvatar="";
                newPost.authorName="";
                newPost.authorId="";
                newPost.authorType=PostResponse.AuthorType.User;
            }
            
            newPost.postId=queryPost._id.toString();
            newPost.postTime=queryPost.PostTime;
            newPost.lastEditTime=queryPost.LastEditTime;
            newPost.content=queryPost.Content;
            newPost.images=queryPost.Images;
            newPost.isActive=queryPost.IsActive;
            newPost.relationship=queryPost.isOwner?PostResponse.Relationship.Owner:PostResponse.Relationship.Guest;
            newPost.wasSaved=queryPost.UserSavedTime!=0?true:false;
            newPost.savedTime=queryPost.UserSavedTime;
            newPost.likeNumber=queryPost.UsersLike.length;
            newPost.wasLiked=queryPost.UserLikedTime!=0?true:false;
            newPost.likedTime=queryPost.UserlikedTime;
            newPost.wasFollowed=queryPost.UserFollowedTime!=0?true:false;
            newPost.followedTime=queryPost.UserFollowedTime;
            newPost.commentsNumber=queryPost.CommentsNumber;

            if(newPost.isActive==true||newPost.isOwner==true){
                resObject.posts.push(newPost);
            }

            res.json(Controller.Success(resObject));  
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },

    //http get, auth
    OwnerGetEditInfo : async function(req,res){  
        try {  
            let idAccount = req.user.id;

            let postId=req.query.id;

            if (postId == undefined || postId == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await PostModel.getDataById(postId,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let queryPost = resAction.data.toObject();

            //check permission
            if (queryPost.AuthorType == PostModel.AuthorType.Team) {
                //check is leader
                if (queryPost.Team.Leader.toString() != idAccount) {
                    //not owner
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return;
                }
            }else if (queryPost.AuthorType == GET_LIST_FILTER.Project) {
                //check is leader
                if (queryPost.Project.Leader.toString() != idAccount) {
                    //not owner
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return;
                }
            }else if (queryPost.AuthorType == GET_LIST_FILTER.User) {
                //check is mine
                if (queryPost.User._id.toString() != idAccount) {
                    //not owner
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return;
                }
            }

            let newPost = new PostResponse.PostOwnerDetail();
            if(queryPost.AuthorType == PostModel.AuthorType.User){
                newPost.authorAvatar=queryPost.User.Avatar;
                newPost.authorName=queryPost.User.Name;
                newPost.authorId=queryPost.User._id.toString();
                newPost.authorType=PostModel.AuthorType.User;
            }else if(queryPost.AuthorType == PostModel.AuthorType.Team){
                newPost.authorAvatar=queryPost.Team.Avatar;
                newPost.authorName=queryPost.Team.Name;
                newPost.authorId=queryPost.Team._id.toString();
                newPost.authorType=PostModel.AuthorType.Team;
            }else if(queryPost.AuthorType == PostModel.AuthorType.Project){
                newPost.authorAvatar=queryPost.Project.Avatar;
                newPost.authorName=queryPost.Project.Name;
                newPost.authorId=queryPost.Project._id.toString();
                newPost.authorType=PostModel.AuthorType.Project;
            }else{
                newPost.authorAvatar="";
                newPost.authorName="";
                newPost.authorId="";
                newPost.authorType=AuthorType.User;
            }
            
            newPost.postId=queryPost._id.toString();
            newPost.postTime=queryPost.PostTime;
            newPost.lastEditTime=queryPost.LastEditTime;
            newPost.content=queryPost.Content;
            newPost.images=queryPost.Images;
            newPost.isActive=queryPost.IsActive;
            newPost.categoryKeywordsId=queryPost.CategoryKeywords.map(e=>e.toString());
            
            res.json(Controller.Success(newPost));  
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },

    //http post, authen
    OwnerUpdate : async function(req,res){  
        let imagesPathDeleteCaseOfError = [];
        let fullPath = "";
        try {  
            let idAccount = req.user.id;

            let activeStatus = req.body.active_status;
            let postId = req.body.post_id;

            let content = req.body.content;
            let categoryKeywordsId = JSON.parse(req.body.keywords)||[];
            let oldImages = JSON.parse(req.body.old_images)||[];

            if (!Controller.isStringArray(categoryKeywordsId)) {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }
            if (!Controller.isStringArray(oldImages)) {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            if (activeStatus != "active" && activeStatus != "inactive") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }
            if (postId == undefined || postId == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
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

            let resAction = await CategoryKeywordModel.getAllCategoryKeywordsByUser(req.lang);
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

            resAction = await PostModel.getDataById(postId,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let editPost = resAction.data.toObject();

            //check permission
            if (editPost.AuthorType == PostModel.AuthorType.Team) {
                //check is leader
                if (editPost.Team.Leader.toString() != idAccount) {
                    //not owner
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return;
                }
            }else if (editPost.AuthorType == PostModel.AuthorType.Project) {
                //check is leader
                if (editPost.Project.Leader.toString() != idAccount) {
                    //not owner
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return;
                }
            }else if (editPost.AuthorType == PostModel.AuthorType.User) {
                //check is mine
                if (editPost.User._id.toString() != idAccount) {
                    //not owner
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return;
                }
            }

            editPost.LastEditTime = Date.now();
            editPost.Content = content;
            editPost.IsActive = activeStatus=="active"?true:false;
            editPost.CategoryKeywords = validCategoryKeywordsId;

            fullPath = Path.join(__dirname,'..','public','images','posts');
            //get delete images path
            let deleteImagesPath = [];
            for(i = editPost.Images.length-1;i>=0;i--){
                if(oldImages.indexOf(editPost.Images[i])==-1){
                    deleteImagesPath.push(editPost.Images[i]);
                    editPost.Images.splice(i,1);
                }
            }

            let beforeImagesNumber =  editPost.Images.length;
            let uploadImagesPath = [];
            let validUploadedImageNumber=0;
            //upload images
            if (req.files && Object.keys(req.files).length !== 0) {
                uploadedImageCount = Object.keys(req.files).length;

                let images = req.files.images;

                // If 'images' is a single file, convert it to an array
                let imageArray = Array.isArray(images) ? images : [images];

                // Process each uploaded file
                imageArray.forEach((image, index) => {
                    if (!image.mimetype.startsWith('image/')) {

                    } else {
                        validUploadedImageNumber++;
                        if(beforeImagesNumber+validUploadedImageNumber>PostModel.MAXIMUM_IMAGES_COUNT){
                            return;
                            //maximun images number of one post
                        }
                        let imageName = Date.now()+"."+ Controller.generateRandomString(10) +"."+ image.name;
                        image.mv(Path.join(fullPath, imageName));
                        uploadImagesPath.push(imageName);
                        imagesPathDeleteCaseOfError.push(imageName);
                    }
                });
            }
            if(uploadImagesPath.length!=0){
                editPost.Images.push(...uploadImagesPath);
            }
            
            
            let updateFields = {$set:{
                LastEditTime:editPost.LastEditTime,
                Content:editPost.Content,
                IsActive:editPost.IsActive,
                LastEditTime:editPost.LastEditTime,
                CategoryKeywords:editPost.CategoryKeywords,
                Images:editPost.Images,
            }};
            //update post
            resAction = await PostModel.updatePost(editPost._id.toString(), updateFields,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error)); 
                //delete image uploaded
                imagesPathDeleteCaseOfError.forEach(path=>{
                    if(Controller.isExistPath(Path.join(fullPath,path))){
                        Controller.deleteFile(Path.join(fullPath,path));
                    }
                });  
                return;
            }
            res.json(Controller.Success({isComplete:true}));   

            //delete images
            deleteImagesPath.forEach(path=>{
                if(Controller.isExistPath(Path.join(fullPath,path))){
                    Controller.deleteFile(Path.join(fullPath,path));
                }
            });
            
        }  
        catch (error) {  
            console.log(error);
            //delete image uploaded
            imagesPathDeleteCaseOfError.forEach(path=>{
                if(Controller.isExistPath(Path.join(fullPath,path))){
                    Controller.deleteFile(Path.join(fullPath,path));
                }
            });
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },
    //not http
    inscreaseCommentNumbers:async function(req,editPost){
        try{
            let updateFields = {$set:{
                CommentsNumber:editPost.CommentsNumber+1
            }};

            resAction = await PostModel.updatePost(editPost._id.toString(), updateFields,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                return false;
            } else {
                return true;
            }
        }catch(err){
            console.log(err);
            return false;
        }
    },

    //http post, authen
    OwnerDelete : async function(req,res){ 
        try {  
            let idAccount = req.user.id;

            let postId = req.body.post_id;

            if (postId == undefined || postId == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            let resAction = await PostModel.getDataById(postId,req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let editPost = resAction.data.toObject();

            //check permission
            if (editPost.AuthorType == PostModel.AuthorType.Team) {
                //check is leader
                if (editPost.Team.Leader.toString() != idAccount) {
                    //not owner
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return;
                }
            }else if (editPost.AuthorType == PostModel.AuthorType.Project) {
                //check is leader
                if (editPost.Project.Leader.toString() != idAccount) {
                    //not owner
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return;
                }
            }else if (editPost.AuthorType == PostModel.AuthorType.User) {
                //check is mine
                if (editPost.User._id.toString() != idAccount) {
                    //not owner
                    res.json(Controller.Fail(Message(req.lang,'permissions_denied_action')));
                    return;
                }
            }

            //delete post
            resAction = await PostModel.deletePost(postId,req.lang);
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

    //http post, authen
    LogFastVisit : async function(req,res){  
        try {  
            let idAccount = req.user.id;

            let postId = req.body.post_id;
            let time = parseInt(req.body.time);
            let totalTimeVideo = parseInt(req.body.total_time_video);
            
            if (postId == undefined || postId == "") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));
                return; 
            }

            if (isNaN(time)){
                time = 0;
            }
            if (isNaN(totalTimeVideo)){
                totalTimeVideo = 0;
            }

            if(time!=0){
                let resAction = await PostModel.getDataById(postId,req.lang);
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return;
                }
    
                //system log
                LogTool.Post.fastVisit(idAccount, postId, time);
            }

            res.json(Controller.Success(resObject));   
        }  
        catch (error) {  
            console.log(error);
            res.json(Controller.Fail(Message(req.lang,"system_error")));   
        }  
    },

}  
  
module.exports = PostController;