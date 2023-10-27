class TeamListItem{
    teamName;
    teamId;
    teamAvatar;
    leaderName;
    leaderId;
    leaderAvatar;
    memberNumber;
    isLeader;
    constructor(
        teamName,
        teamId,
        teamAvatar,
        leaderName,
        leaderId,
        leaderAvatar,
        memberNumber,
        isLeader
    ) {
        this.teamName = teamName;
        this.teamId = teamId;
        this.teamAvatar = teamAvatar;
        this.leaderName = leaderName;
        this.leaderId = leaderId;
        this.leaderAvatar = leaderAvatar;
        this.memberNumber = memberNumber;
        this.isLeader = isLeader;
    }
}
module.exports.TeamListItem = TeamListItem;

module.exports.Member = class {
    id;
    name;
    avatar;
    isLeader;
    constructor(id,name,avatar,isLeader=false) {
        this.id=id;
        this.name=name;
        this.avatar=avatar;
        this.isLeader=isLeader;
    }
}
module.exports.Skill = class {
    id;
    name;
    image;
    number;
    constructor(id,name,image,number=1) {
        this.id=id;
        this.name=name;
        this.image=image;
        this.number=number;
    }
}
class TeamDetails{
    teamId;
    teamName;
    teamAvatar;
    leaderId;
    leaderName;
    leaderAvatar;
    maxim;
    description;
    internalInfo;
    relationship;
    members=[];
    skills=[];
    chanelChatId;
    constructor(
        teamId,
        teamName,
        teamAvatar,
        leaderId,
        leaderName,
        leaderAvatar,
        maxim,
        description,
        internalInfo,
        relationship,
        chanelChatId,
    ) {
        this.teamId=teamId;
        this.teamName=teamName;
        this.teamAvatar=teamAvatar;
        this.leaderId=leaderId;
        this.leaderName=leaderName;
        this.leaderAvatar=leaderAvatar;
        this.maxim=maxim;
        this.description=description;
        this.internalInfo=internalInfo;
        this.relationship=relationship;
        this.chanelChatId=chanelChatId;
    }
}
module.exports.TeamDetails = TeamDetails;
module.exports.Relationship = {
    Guest: "guest",
    UserLogin: "userlogin",
    Leader: "leader",
    Member: "member",
    
};
module.exports.MembersList = {
    members:[],
    isLeader:false
}