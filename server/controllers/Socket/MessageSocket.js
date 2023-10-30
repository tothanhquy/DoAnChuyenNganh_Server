const Room = require('./Room');
const SocketEventNames = require('./SocketEventNames');


module.exports.sendRealTimeMessages = (io, idChanelChat, messages)=>{
    Room.SendToRoom(
        io,
        Room.ROOM_NAME_PRIFIX.RealChatChanelChat+idChanelChat,
        SocketEventNames.SEND.ChanelChatNewMessages,
        {messages});
}