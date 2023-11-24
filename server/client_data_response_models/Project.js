class ProjectListItem{
    projectId;
    projectName;
    projectAvatar;
    leaderId;
    leaderName;
    leaderAvatar;
    memberNumber;
    isLeader;
    constructor(
        projectId,
        projectName,
        projectAvatar,
        leaderId,
        leaderName,
        leaderAvatar,
        memberNumber,
        isLeader
    ) {
        this.projectId = projectId;
        this.projectName = projectName;
        this.projectAvatar = projectAvatar;
        this.leaderId = leaderId;
        this.leaderName = leaderName;
        this.leaderAvatar = leaderAvatar;
        this.memberNumber = memberNumber;
        this.isLeader = isLeader;
    }
}
module.exports.ProjectListItem = ProjectListItem;

module.exports.MemberNow = class {
    id;
    name;
    avatar;
    role;
    isLeader;
    constructor(id,name,avatar,role,isLeader=false) {
        this.id=id;
        this.name=name;
        this.avatar=avatar;
        this.role=role;
        this.isLeader=isLeader;
    }
}
module.exports.MemberHistory = class {
    id;
    name;
    avatar;
    role;
    time;
    isOut;
    constructor(id,name,avatar,role,time,isOut=false) {
        this.id=id;
        this.name=name;
        this.avatar=avatar;
        this.role=role;
        this.time=time;
        this.isOut=isOut;
    }
}
module.exports.CategoryKeyword = class {
    id;
    name;
    constructor(id,name) {
        this.id=id;
        this.name=name;
    }
}
module.exports.CategoryKeywordList = class {
    keywords=[];
    isLeader=false;
    constructor(keywords,isLeader=false) {
        this.keywords=keywords;
        this.isLeader=isLeader;
    }
    constructor(){}
}
class ProjectDetails{
    projectId;
    projectName;
    projectAvatar;
    leaderId;
    leaderName;
    leaderAvatar;
    slogon;
    description;
    relationship;
    members=[];
    categoryKeywords=[];
    tags=[];
    followsNumber=0;
    isFollow=false;
    imagesNumber=0;
    videosNumber=0;
    voteStar=0;
    resportsNumber=0;
    constructor(
        projectId,
        projectName,
        projectAvatar,
        leaderId,
        leaderName,
        leaderAvatar,
        slogon,
        description,
        relationship
    ) {
        this.projectId=projectId;
        this.projectName=projectName;
        this.projectAvatar=projectAvatar;
        this.leaderId=leaderId;
        this.leaderName=leaderName;
        this.leaderAvatar=leaderAvatar;
        this.slogon=slogon;
        this.description=description;
        this.relationship=relationship;
    }
    constructor(){}
}
module.exports.ProjectDetails = ProjectDetails;
class ProjectEditBasicInfo{
    name;
    slogon;
    description;
    constructor(
        name,
        slogon,
        description
    ) {
        this.name=name;
        this.slogon=slogon;
        this.description=description;
    }
    constructor(){}
}
module.exports.ProjectEditBasicInfo = ProjectEditBasicInfo;
module.exports.Relationship = {
    Guest: "guest",
    UserLogin: "userlogin",
    Leader: "leader",
    Member: "member",
};
module.exports.MembersList = class{
    members=[];
    isLeader=false;
    constructor(){}
}