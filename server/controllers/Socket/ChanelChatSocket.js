const ChanelChatResponse = require('../../client_data_response_models/ChanelChat');
const Room = require('./Room');
const SocketEventNames = require('./SocketEventNames');


module.exports.notifiUserSeen = (io, idChanelChat, idUserSeen, idMessage)=>{
    try{
        Room.SendToRoom(
            io,
            Room.ROOM_NAME_PRIFIX.RealChatChanelChat+idChanelChat,
            SocketEventNames.SEND.ChanelChatUserSeen,
            new ChanelChatResponse.UserSeenSocket(idChanelChat,idUserSeen,idMessage));
    }catch(err){
        console.log(err)
    }
}
module.exports.notifiLastMessageForMembers = (io, notifiLastNewMessagesSocket)=>{
    try{
        notifiLastNewMessagesSocket.forEach(element => {
            Room.SendToRoom(
                io,
                Room.ROOM_NAME_PRIFIX.User+element.idReceiveUser,
                SocketEventNames.SEND.ChanelChatNotifiLastMessage,
                {element});
        });
    }catch(err){
        console.log(err)
    }
}
module.exports.notifiHasNewChanelForNewMembers = (io, idUsers)=>{
    try{
        idUsers.forEach(element => {
        Room.SendToRoom(
            io,
            Room.ROOM_NAME_PRIFIX.User+element,
            SocketEventNames.SEND.ChanelChatYouHasNewChanel,
            element);
        });
    }catch(err){
        console.log(err)
    }
}