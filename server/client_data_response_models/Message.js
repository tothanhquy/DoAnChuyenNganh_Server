module.exports.Message = class{
    id;
    content;
    userId;
    // userName;
    // userAvatar;
    time;
    replyContent;
    replyTime;
    replyId;
    constructor(
        id,
        content,
        userId,
        // userName,
        // userAvatar,
        time,
        replyContent,
        replyTime,
        replyId,
    ){
        this.id=id;
        this.content=content;
        this.userId=userId;
        // this.userName=userName;
        // this.userAvatar=userAvatar;
        this.time=time;
        this.replyContent=replyContent;
        this.replyTime=replyTime;
        this.replyId=replyId;
    }
}
module.exports.Messages = class{
    messages=[];
    isFinish=false;
    constructor(){}
}
module.exports.MessageSocket = class{
    id;
    content;
    userId;
    chanelChatId;
    time;
    replyContent;
    replyTime;
    replyId;
    constructor(
        id,
        content,
        userId,
        chanelChatId,
        time,
        replyContent,
        replyTime,
        replyId,
    ){
        this.id=id;
        this.content=content;
        this.userId=userId;
        this.chanelChatId=chanelChatId;
        this.time=time;
        this.replyContent=replyContent;
        this.replyTime=replyTime;
        this.replyId=replyId;
    }
}