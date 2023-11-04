const ChanelChatResponse = require('../../client_data_response_models/ChanelChat');
const Room = require('./Room');
const SocketEventNames = require('./SocketEventNames');


module.exports.notifiUserSeen = (io, idChanelChat, idUserSeen, idMessage)=>{
    Room.SendToRoom(
        io,
        Room.ROOM_NAME_PRIFIX.RealChatChanelChat+idChanelChat,
        SocketEventNames.SEND.ChanelChatUserSeen,
        new ChanelChatResponse.UserSeenSocket(idChanelChat,idUserSeen,idMessage));
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
module.exports.notifiHasNewChanelForNewMembers = (io, idUsers)=>{
    idUsers.forEach(element => {
    Room.SendToRoom(
        io,
        Room.ROOM_NAME_PRIFIX.User+element,
        SocketEventNames.SEND.ChanelChatYouHasNewChanel,
        element);
    });
}