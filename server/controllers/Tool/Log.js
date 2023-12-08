const TypeLog = require("../../log_constants/TypeLog");
const TypeObject = require("../../log_constants/TypeObject");
const LogModel = require('../../models/LogModel');


// ActionUser: null,
// Time: 0,
// TypeCode: 0,
// MainObject: null,
// SubObject: null,
// SubObject2: null,

const User={
    visit: async (
        actionUserId,
        affectedUserId
        )=>{
            try{
                let log = LogModel.getLogAsObject();
                log.ActionUser = actionUserId;
                log.Time = Date.now();
                log.TypeCode = TypeLog.User.Visit.Code;
                log.MainObject = LogModel.getLogObjectAsObject(affectedUserId,TypeObject.User);

                let res = await LogModel.createLog(log,"default_lang");
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
}
const Team={
    visit: async (
        actionUserId,
        affectedTeamId
        )=>{
            try{
                let log = LogModel.getLogAsObject();
                log.ActionUser = actionUserId;
                log.Time = Date.now();
                log.TypeCode = TypeLog.Team.Visit.Code;
                log.MainObject = LogModel.getLogObjectAsObject(affectedTeamId,TypeObject.Team);

                let res = await LogModel.createLog(log,"default_lang");
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
}
const Project={
    visit: async (
        actionUserId,
        affectedProjectId
        )=>{
            try{
                let log = LogModel.getLogAsObject();
                log.ActionUser = actionUserId;
                log.Time = Date.now();
                log.TypeCode = TypeLog.Project.Visit.Code;
                log.MainObject = LogModel.getLogObjectAsObject(affectedProjectId,TypeObject.Project);

                let res = await LogModel.createLog(log,"default_lang");
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
}
const Post={
    detailsVisit: async (
        actionUserId,
        affectedPostId
        )=>{
            try{
                let log = LogModel.getLogAsObject();
                log.ActionUser = actionUserId;
                log.Time = Date.now();
                log.TypeCode = TypeLog.Post.DetailsVisit.Code;
                log.MainObject = LogModel.getLogObjectAsObject(affectedPostId,TypeObject.Post);

                let res = await LogModel.createLog(log,"default_lang");
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
    fastVisit: async (
        actionUserId,
        affectedPostId, lastingTime
        )=>{
            try{
                let log = LogModel.getLogAsObject();
                log.ActionUser = actionUserId;
                log.Time = Date.now();
                log.TypeCode = TypeLog.Post.FastVisit.Code;
                log.MainObject = LogModel.getLogObjectAsObject(affectedPostId,TypeObject.Post);
                log.MainObject = LogModel.getTimeRangeAsObject(lastingTime);

                let res = await LogModel.createLog(log,"default_lang");
                return true;
            }catch(err){
                console.log(err);
                return false;
            }
    },
}



const ToolsOfLog = {
    User:User,
    Team:Team,
    Project:Project,
    Post:Post,
}
module.exports = ToolsOfLog;