
module.exports.Relationship = {
    Owner: "owner",
    Guest:"guest",
}
module.exports.Post = class { 
    authorAvatar;
    authorName;
    authorId;
    postId;
    authorType;
    postTime;
    saveTime;
    content;
    images;
    isActive;
    wasSaved;
    relationship;
    constructor(
        authorAvatar,
        authorName,
        authorId,
        postId,
        authorType,
        postTime,
        saveTime,
        content,
        images,
        isActive,
        wasSaved,
        relationship,
    ) {
        this.authorAvatar=authorAvatar;
        this.authorName=authorName;
        this.authorId=authorId;
        this.postId=postId;
        this.authorType=authorType;
        this.postTime=postTime;
        this.saveTime=saveTime;
        this.content=content;
        this.images=images;
        this.isActive=isActive;
        this.wasSaved=wasSaved;
        this.relationship=relationship;
    }

}
module.exports.PostsListObject = class {
    isActionable;
    posts;
    isFinish;
    timePrevious;
    constructor(
        posts,
        timePrevious,
        isFinish = false,
        isActionable = false,
    ) {
        this.posts=posts;
        this.timePrevious=timePrevious;
        this.isFinish=isFinish;
        this.isActionable=isActionable;
    }

}
