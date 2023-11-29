const Relationship= module.exports.Relationship = {
    Owner: "owner",
    Guest:"guest",
}
const AuthorType = module.exports.AuthorType = {
    Team: "team",
    User:"user",
    Project:"project",
}
module.exports.PostListItem = class { 
    authorAvatar="";
    authorName="";
    authorId="";
    authorType=AuthorType.User;
    isOwner=false;
    postId="";
    postTime=0;
    content="";
    images=[];
    isActive=true;
    relationship=Relationship.Guest;
    wasSaved=false;
    savedTime=0;
    likeNumber=0;
    wasLiked=false;
    likedTime=0;
    wasFollowed=false;
    followedTime=0;
    commentsNumber=0;
    constructor(){}
}
module.exports.PostOwnerDetail = class { 
    authorAvatar="";
    authorName="";
    authorId="";
    postId="";
    authorType=AuthorType.User;
    postTime=0;
    content="";
    images=[];
    isActive=true;
    categoryKeywordsId=[];
    constructor(){}
}
module.exports.PostsListObject = class {
    isActionable=false;
    posts=[];//PostListItem
    isFinish=false;
    timePrevious=0;
    constructor(
        posts=[],
        timePrevious=0,
        isFinish = false,
        isActionable = false,
    ) {
        this.posts=posts;
        this.timePrevious=timePrevious;
        this.isFinish=isFinish;
        this.isActionable=isActionable;
    }

}
module.exports.PostUpdateInteractResponse = class {
    isComplete=false;
    status=PostUpdateInteractResponseStatus.Liked;
    totalNumber=0;
    constructor(){}
}
const PostUpdateInteractResponseStatus = module.exports.PostUpdateInteractResponseStatus = {
    Followed:"followed",
    Unfollowed:"unfollowed",
    Saved:"saved",
    Unsaved:"unsaved",
    Liked:"liked",
    Unliked:"unliked",
}