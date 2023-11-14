const Room = require('./Room');
const SocketEventNames = require('./SocketEventNames');


module.exports.sendRealTimeMessages = (io, idChanelChat, messages)=>{
    try{
        Room.SendToRoom(
            io,
            Room.ROOM_NAME_PRIFIX.RealChatChanelChat+idChanelChat,
            SocketEventNames.SEND.ChanelChatNewMessages,
            {messages:messages});
    }catch(err){
        console.log(err)
    }
    
}