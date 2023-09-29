module.exports.FriendListItem = class {
    id;
    name;
    avatar;
    constructor(
        id,
        name,
        avatar,
    ) {
        this.id = id;
        this.name = name;
        this.avatar = avatar;
    }
}
module.exports.FriendRequestsItem = class {
    id;
    userId;
    userName;
    userAvatar;
    time;
    constructor(
        id,
        userId,
        userName,
        userAvatar,
        time,
    ) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.userAvatar = userAvatar;
        this.time = time;
    }
}
module.exports.FriendRequests = class {
    timePrevious;
    isFinish;
    requests;
    constructor(
        timePrevious,
        isFinish,
        requests,
    ) {
        this.timePrevious = timePrevious;
        this.isFinish = isFinish;
        this.requests = requests;
    }
}
module.exports.FriendRequest = class {
    id;
    content;
    userId;
    userAvatar;
    userName;
    time;
    constructor(
        id,
        content,
        userId,
        userName,
        userAvatar,
        time,
    ) {
        this.id = id;
        this.content = content;
        this.userId = userId;
        this.userName = userName;
        this.userAvatar = userAvatar;
        this.time = time;
    }
}