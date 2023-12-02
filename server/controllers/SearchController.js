const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var TeamModel = require('../models/TeamModel');  
var AccountModel = require('../models/AccountModel');  
var ProjectModel = require('../models/ProjectModel');  
var Controller = require('./Controller');
const SearchResponse = require("../client_data_response_models/Search");

const LIMIT_MESSAGES_PER_RESQUEST = 30;
const SEARCH_TYPE_OBJECT = {
    User:"user",
    Team:"team",
    Project:"project"
}
var MessageController = { 

    //http get
    SearchUserTeamProject: async (req,res) => {
        try {
            let search = req.query.search;
            let type = req.query.type;
            // let lastTime = parseInt(req.query.last_time);

            // if (lastTime == undefined || lastTime == "" || isNaN(lastTime)) {
            //     lastTime = Date.now();
            // }
            if (search == undefined) {
                search = "";
            }
            if (type !== SEARCH_TYPE_OBJECT.User 
                && type !== SEARCH_TYPE_OBJECT.Project 
                && type !== SEARCH_TYPE_OBJECT.Team){
                res.json(Controller.Fail(Message(req.lang, "system_error")));  
                return;
            }
            search = Controller.toNonAccentVietnamese(search).toLowerCase();
            let condition = {$text: { $search: search,$caseSensitive:true }};
            if(search=="")condition={};//get all
            let resAction;
            let tagsQuery=[];
            if (type == SEARCH_TYPE_OBJECT.User){
                resAction = await AccountModel.find(condition);
            }else if (type == SEARCH_TYPE_OBJECT.Team){
                resAction = await TeamModel.find(condition);
            }else{
                if(search!=""){
                    let tags = search.split(" ");
                    let resAction2 = await ProjectModel.getProjectsByTags(tags,req.lang);
                    if (resAction2.status == ModelResponse.ResStatus.Fail) {
                        res.json(Controller.Fail(resAction2.error));
                        return;
                    }
                    tagsQuery = resAction2.data;
                }
                resAction = await ProjectModel.find(condition);
            }
            let resObject = new SearchResponse.SearchItems();
            queryItems=resAction;
            if (type == SEARCH_TYPE_OBJECT.User){
                queryItems.forEach(element => {
                    resObject.items.push(new SearchResponse.SearchItem(element._id.toString(),element.Name,element.Avatar,SearchResponse.ObjectType.User));
                });
            }else if (type == SEARCH_TYPE_OBJECT.Team){
                queryItems.forEach(element => {
                    resObject.items.push(new SearchResponse.SearchItem(element._id.toString(),element.Name,element.Avatar,SearchResponse.ObjectType.Team));
                });
            }else{
                let objectsByTagsId = tagsQuery.map(e=>e._id.toString());
                tagsQuery.forEach(element => {
                    resObject.items.push(new SearchResponse.SearchItem(element._id.toString(),element.Name,element.Avatar,SearchResponse.ObjectType.Project));
                });
                queryItems.forEach(element => {
                    if(objectsByTagsId.indexOf(element._id.toString())==-1)
                        resObject.items.push(new SearchResponse.SearchItem(element._id.toString(),element.Name,element.Avatar,SearchResponse.ObjectType.Project));
                });
            }
            console.log(resObject)
            res.json(Controller.Success(resObject));  
        }  
        catch (error) {  
            console.log(error)
            res.json(Controller.Fail(Message(req.lang, "system_error")));  
        }  
    },
}  

module.exports = MessageController;