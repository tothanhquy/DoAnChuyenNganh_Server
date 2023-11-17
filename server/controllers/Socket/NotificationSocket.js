const Room = require('./Room');
const SocketEventNames = require('./SocketEventNames');


module.exports.sendNewNitification = (io, idUser, idNotification)=>{
    try{
        Room.SendToRoom(
            io,
            Room.ROOM_NAME_PRIFIX.User+idUser,
            SocketEventNames.SEND.NotificationNew,
            idNotification);
    }catch(err){
        console.log(err)
    }
    
}