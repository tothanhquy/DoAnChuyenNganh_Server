module.exports.ChanelChatsItem = class {
    type;
    id;
    name;
    avatar;
    lastTime;
    lastMessage;
    constructor(
        type,
        id,
        name,
        avatar,
        lastTime,
        lastMessage,
    ) {
        this.type = type;
        this.id = id;
        this.name = name;
        this.avatar = avatar;
        this.lastTime = lastTime;
        this.lastMessage = lastMessage;
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