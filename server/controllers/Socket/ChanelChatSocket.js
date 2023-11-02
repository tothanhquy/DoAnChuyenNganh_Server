const { emit } = require('../../models/AccountModel');
const Room = require('./Room');
const SocketEventNames = require('./SocketEventNames');


module.exports.notifiUserSeen = (io, idChanelChat, idUserSeen, idMessage)=>{
    Room.SendToRoom(
        io,
        Room.ROOM_NAME_PRIFIX.RealChatChanelChat+idChanelChat,
        SocketEventNames.SEND.ChanelChatUserSeen,
        {idChanelChat,idUserSeen,idMessage});
}
module.exports.notifiLastMessageForMembers = (io, notifiLastNewMessagesSocket)=>{
    notifiLastNewMessagesSocket.forEach(element => {
        Room.SendToRoom(
            io,
            Room.ROOM_NAME_PRIFIX.User+element.idReceiveUser,
            SocketEventNames.SEND.ChanelChatNotifiLastMessage,
            {element});
    });
}