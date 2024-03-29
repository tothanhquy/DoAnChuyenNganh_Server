module.exports.Comment=class{
    commentId="";
    wasDeleted=false;
    content="";
    postId="";
    authorId="";
    authorName="";
    authorAvatar="";
    time=0;
    replyId="";
    level=0;
    likeNumber=0;
    wasLike=false;
    replyNumber=0;
    isLoadMore=false;//not load more
    isAuthor=false;
    constructor(
        commentId="",
        wasDeleted=false,
        content="",
        postId="",
        authorId="",
        authorName="",
        authorAvatar="",
        time=0,
        replyId="",
        level=0,
        likeNumber=0,
        wasLike=false,
        replyNumber=0,
        isLoadMore=false,
        isAuthor=false,
    ){
        this.commentId=commentId;
        this.wasDeleted=wasDeleted;
        this.content=content;
        this.postId=postId;
        this.authorId=authorId;
        this.authorName=authorName;
        this.authorAvatar=authorAvatar;
        this.time=time;
        this.replyId=replyId;
        this.level=level;
        this.likeNumber=likeNumber;
        this.wasLike=wasLike;
        this.replyNumber=replyNumber;
        this.isLoadMore=isLoadMore;
        this.isAuthor=isAuthor;
    }
}
module.exports.Comments=class{
    comments=[];
    isActionable=false;
    constructor(){}
}
module.exports.CommentUpdateInteractResponse = class {
    isComplete=false;
    status=CommentUpdateInteractResponseStatus.Liked;
    totalNumber=0;
    constructor(){}
}
const CommentUpdateInteractResponseStatus = module.exports.CommentUpdateInteractResponseStatus = {
    Deleted:"deleted",
    Liked:"liked",
    Unliked:"unliked",
}