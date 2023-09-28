const ViewAlert = require('../view_models/ViewAlert');
const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var TeamModel = require('../models/TeamModel');  
var AccountModel = require('../models/AccountModel');  
var PostModel = require('../models/PostModel');
var Auth = require('../core/Auth');  
const Mail = require('../core/Mail');
var Controller = require('./Controller');
const PostResponse = require("../client_data_response_models/Post");
const Path = require('path');

const GET_LIST_LIMIT_POSTS = 20;

//containt the function with business logics  
var PostController = {  
    
    //http post, authen
    Create : async function(req,res){  
        try {  
            console.log(req.body)
            let idAccount = req.user.id;
            let creator = req.body.creator;

            if (creator != "leader" && creator != "user") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }
            let teamId=undefined;
            if (creator == "leader") {
                teamId = req.body.team_id;
            }

            let content = req.body.content;

            //valid
            let contentValid = PostModel.isValidContent(content, req.lang);
            if (!contentValid.isValid) {
                res.json(Controller.Fail(contentValid.error));
                return;
            }

            
            let resAction;
            

            if (creator == "leader") {
                //check team exist
                resAction = await TeamModel.getDataById(teamId, req.lang);
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
            }
            
            //get images
            let createImages = [];
            let validUploadedImageNumber = 0;
            let uploadedImageCount = 0;
            //upload image
            if (req.files && Object.keys(req.files).length !== 0) {
                uploadedImageCount = Object.keys(req.files).length;
                console.log(req.files);
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
                        let imageName = Date.now()+"."+validUploadedImageNumber +"."+ image.name;
                        image.mv(Path.join(fullPath, imageName));
                        createImages.push(imageName);
                    }
                });
                
            }
            

            let authorType;
            let userId;

            if (creator == "leader") {
                authorType = PostModel.AuthorType.Team;
                teamId = teamId;
                userId = undefined;
            } else {
                authorType = PostModel.AuthorType.User;
                teamId = undefined;
                userId = idAccount;
            }
            
            //create
            const postModel = {  
                AuthorType: authorType,
                Content: content,
                Team: teamId,
                User: userId,
                PostTime: Date.now(),
                Images: createImages,
            };   

            resAction = await PostModel.createPost(postModel,req.lang); 
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            } else {
                
                res.json(Controller.Success({ isComplete:true,uploadImageResult:""+validUploadedImageNumber+"/"+uploadedImageCount }));
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
            let teamId=undefined;

            let timePrivious = req.query.time;
            if (timePrivious == undefined || timePrivious == 0) timePrivious = Date.now();

            if (filter !== "team" && filter !== "guest" && filter !== "user_save"&& filter !== "user_own") {
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }

            let resAction;

            let isLeader = false;
            if (filter == "team") {
                teamId = req.query.team_id;
                //check team exist
                resAction = await TeamModel.getDataById(teamId,req.lang);
                let queryTeam = resAction.data;
                if (resAction.status == ModelResponse.ResStatus.Fail) {
                    res.json(Controller.Fail(resAction.error));
                    return;
                }
                //check is leader
                if (idAccount!==undefined && queryTeam.Leader.toString() == idAccount) {
                    //not leader
                    isLeader = true;
                }
            } if (filter == "user_save" || filter == "user_own") {
                //lot login
                if (idAccount === undefined) {
                    res.json(Controller.Fail(Message(req.lang, "system_error")));
                    return;
                }
            }

            let condition;
            let populateAccount = {
                path: 'User',
                select: '_id Name Avatar'
            };
            let populateTeam = {
                path: 'Team',
                select: '_id Name Avatar Leader'
            };
            if (filter == "guest") {

                condition = {
                    IsActive:true,
                    PostTime: {$lt:timePrivious}
                }
                
            } else if (filter == "team"){
                //team
                if (isLeader) {
                    condition = {
                        AuthorType: PostModel.AuthorType.Team,
                        Team:teamId,
                        PostTime: {$lt:timePrivious}
                    }
                } else {
                    condition = {
                        AuthorType: PostModel.AuthorType.Team,
                        Team:teamId,
                        IsActive:true,
                        PostTime: {$lt:timePrivious}
                    }
                }
            } else if (filter == "user_own"){
                condition = {
                    AuthorType: PostModel.AuthorType.User,
                    User:idAccount,
                    PostTime: {$lt:timePrivious}
                }
            } else {
                //user save
                condition = {
                    IsActive:true,
                    'UsersSave.User':{$in:[idAccount]}
                }
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
    Update : async function(req,res){  
        try {  
            let idAccount = req.user.id;

            let status = req.body.status;
            let postId = req.body.post_id;
            console.log(req.body);

            if (status !== "active" && status !== "save") {
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