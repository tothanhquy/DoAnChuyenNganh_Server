module.exports.RequestsListObject = class {
    viewer;
    method;
    requests;
    isFinish;
    timePrevious;
    constructor(
        viewer,
        method,
        requests,
        timePrevious,
        isFinish=false,
    ) {
        this.viewer=viewer;
        this.method=method;
        this.requests=requests;
        this.timePrevious=timePrevious;
        this.isFinish=isFinish;
    }

}

// module.exports.RequestsListObject = class {
//     title;
//     content;
//     isWaitting;
//     requestType;
//     wasReaded;
//     wasResponsed;
//     isAgree;
//     isImportant;
//     userId;
//     userName;
//     userAvatar;
//     teamId;
//     teamName;
//     teamAvatar;
//     teamLeaderId;
//     teamLeaderName;
//     teamLeaderAvatar;
//     requestTime;
//     responseTime;
//     constructor(
//         title,
//         content,
//         isWaitting,
//         requestType,
//         wasReaded,
//         wasResponsed,
//         isAgree,
//         isImportant,
//         userId,
//         userName,
//         userAvatar,
//         teamId,
//         teamName,
//         teamAvatar,
//         teamLeaderId,
//         teamLeaderName,
//         teamLeaderAvatar,
//         requestTime,
//         responseTime,
//     ) {
//         this.title=title;
//         this.content=content;
//         this.isWaitting=isWaitting;
//         this.requestType=requestType;
//         this.wasReaded=wasReaded;
//         this.wasResponsed=wasResponsed;
//         this.isAgree=isAgree;
//         this.isImportant=isImportant;
//         this.userId=userId;
//         this.userName=userName;
//         this.userAvatar=userAvatar;
//         this.teamId=teamId;
//         this.teamName=teamName;
//         this.teamAvatar=teamAvatar;
//         this.teamLeaderId=teamLeaderId;
//         this.teamLeaderName=teamLeaderName;
//         this.teamLeaderAvatar=teamLeaderAvatar;
//         this.requestTime=requestTime;
//         this.responseTime=responseTime;
//     }
// }