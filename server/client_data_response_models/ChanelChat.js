module.exports.ChanelChatsItem = class {
    type;
    id;
    name;
    avatar;
    lastTime;
    lastMessage;
    numberOfNewMessages;
    constructor(
        type,
        id,
        name,
        avatar,
        lastTime,
        lastMessage,
        numberOfNewMessages=0,
    ) {
        this.type = type;
        this.id = id;
        this.name = name;
        this.avatar = avatar;
        this.lastTime = lastTime;
        this.lastMessage = lastMessage;
        this.numberOfNewMessages = numberOfNewMessages;
    }

}
module.exports.ChanelChatDetails = class {
    type;
    id;
    name;
    avatar;
    lastTime;
    lastMessage;
    isGroupOwner;
    constructor(
        type,
        id,
        name,
        avatar,
        lastTime,
        lastMessage,
        isGroupOwner=false,
    ) {
        this.type = type;
        this.id = id;
        this.name = name;
        this.avatar = avatar;
        this.lastTime = lastTime;
        this.lastMessage = lastMessage;
        this.isGroupOwner = isGroupOwner;
    }

}
module.exports.ChanelChatMemberList = class {
    members=[];
    isGroupOwner=false;
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
    idChanelChat;
    idReceiveUser;
    numberOfNewMessages;
    constructor(
        content,
        idChanelChat,
        idReceiveUser,
        numberOfNewMessages,
    ){
        this.content=content;
        this.idChanelChat=idChanelChat;
        this.idReceiveUser=idReceiveUser;
        this.numberOfNewMessages=numberOfNewMessages;
    }
}