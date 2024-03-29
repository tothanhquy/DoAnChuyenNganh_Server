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
module.exports.MyProjectsAndRequest = class{
    projects=[];
    invitingRequestNumber=0;
    
}

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
module.exports.InvitingMember = class {
    id;
    name;
    avatar;
    role;
    time;
    constructor(id,name,avatar,role,time) {
        this.id=id;
        this.name=name;
        this.avatar=avatar;
        this.role=role;
        this.time=time;
    }
}
module.exports.InvitingProject = class {
    id;
    name;
    avatar;
    role;
    time;
    constructor(id,name,avatar,role,time) {
        this.id=id;
        this.name=name;
        this.avatar=avatar;
        this.role=role;
        this.time=time;
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
}
class ProjectDetails{
    projectId;
    projectName;
    projectAvatar;
    leaderId;
    leaderName;
    leaderAvatar;
    slogan;
    description;
    relationship;
    members=[];
    invitingMembersNumber=0;
    categoryKeywords=[];
    tags=[];
    followsNumber=0;
    isFollow=false;
    imagesNumber=0;
    videosNumber=0;
    voteStar=0;
    reportsNumber=0;
    constructor(
        projectId,
        projectName,
        projectAvatar,
        leaderId,
        leaderName,
        leaderAvatar,
        slogan,
        description,
        relationship
    ) {
        this.projectId=projectId;
        this.projectName=projectName;
        this.projectAvatar=projectAvatar;
        this.leaderId=leaderId;
        this.leaderName=leaderName;
        this.leaderAvatar=leaderAvatar;
        this.slogan=slogan;
        this.description=description;
        this.relationship=relationship;
    }
    
}
module.exports.ProjectDetails = ProjectDetails;
class ProjectEditBasicInfo{
    name;
    slogan;
    description;
    constructor(
        name,
        slogan,
        description
    ) {
        this.name=name;
        this.slogan=slogan;
        this.description=description;
    }
    
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
    
}
module.exports.GeneralNegativeReport = class {
    id;
    number;
    constructor(id,number=1) {
        this.id=id;
        this.number=number;
    }
    
}
module.exports.GeneralNegativeReports = class {
    reports=[];
    constructor(reports=[]) {
        this.reports=reports;
    }
    
}
module.exports.Resource = class {
    path;
    alt;
    constructor(path,alt) {
        this.path=path;
        this.alt=alt;
    }
    
}
module.exports.Resources = class {
    resources=[];
    isLeader=false;
    constructor(resources=[],isLeader=false) {
        this.resources=resources;
        this.isLeader=isLeader;
    }
    
}