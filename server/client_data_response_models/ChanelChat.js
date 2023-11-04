module.exports.ChanelChatsItem = class {
    type;
    id;
    name;
    avatar;
    lastTimeAction;
    lastMessageTime;
    lastMessageContent;
    numberOfNewMessages;
    constructor(
        type,
        id,
        name,
        avatar,
        lastTimeAction,
        lastMessageTime,
        lastMessageContent,
        numberOfNewMessages=0,
    ) {
        this.type = type;
        this.id = id;
        this.name = name;
        this.avatar = avatar;
        this.lastTimeAction = lastTimeAction;
        this.lastMessageTime = lastMessageTime;
        this.lastMessageContent = lastMessageContent;
        this.numberOfNewMessages = numberOfNewMessages;
    }

}
module.exports.ChanelChatDetails = class {
    type;
    id;
    name;
    avatar;
    isGroupOwner;
    teamId;
    friendId;
    accountId;
    members=[];//ChanelChatMember
    lastTimeMemberSeen=[];//LastTimeMemberSeen
    constructor(
        type='',
        id='',
        name='',
        avatar='',
        isGroupOwner=false,
        teamId=null,
        friendId=null,
        accountId=null,
        members=[],
        lastTimeMemberSeen=[]
    ) {
        this.type = type;
        this.id = id;
        this.name = name;
        this.avatar = avatar;
        this.isGroupOwner = isGroupOwner;
        this.teamId=teamId;
        this.friendId=friendId;
        this.accountId=accountId;
        this.members=members;
        this.lastTimeMemberSeen=lastTimeMemberSeen;
    }

}
module.exports.ChanelChatMemberList = class {
    members=[];
    isGroupOwner=false;
    accountId;
    type;
    constructor(
    ){
    }
}
module.exports.ChanelChatMember = class{
    id;
    name;
    avatar;
    constructor(
        id,
        name,
        avatar,
    ){
        this.id = id;
        this.name = name;
        this.avatar = avatar;
    }
}
module.exports.LastTimeMemberSeen = class{
    userId;
    messageId;
    constructor(
        userId,
        messageId,
    ){
        this.userId = userId;
        this.messageId = messageId;
    }
}
module.exports.UserSeen = class {
    idUser;
    idMessage;
    constructor(
        idUser,
        idMessage,
    ){
        this.idUser=idUser;
        this.idMessage=idMessage;
    }
}
module.exports.LastNewMessageSocket = class {
    content;
    time;
    idChanelChat;
    idReceiveUser;
    numberOfNewMessages;
    constructor(
        content,
        time,
        idChanelChat,
        idReceiveUser,
        numberOfNewMessages,
    ){
        this.content=content;
        this.time=time;
        this.idChanelChat=idChanelChat;
        this.idReceiveUser=idReceiveUser;
        this.numberOfNewMessages=numberOfNewMessages;
    }
}
module.exports.UserSeenSocket = class {
    idMessage;
    idUserSeen;
    idChanelChat;
    constructor(
        idChanelChat,
        idUserSeen,
        idMessage,
    ){
        this.idChanelChat=idChanelChat;
        this.idUserSeen=idUserSeen;
        this.idMessage=idMessage;
    }
}