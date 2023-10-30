const Auth = require('../../core/Auth');
const ChanelChatController = require('../ChanelChatController');

const ROOM_NAME_PRIFIX = {
    User:"user-",
    ChanelChat:"chanel-chat-",
    RealChatChanelChat:"real-chat-chanel-chat-",
}
module.exports.ROOM_NAME_PRIFIX = ROOM_NAME_PRIFIX;

module.exports.JoinPersonalRoom = async (io, socket, beforeRooms, data)=>{
    let authRes = Auth.checkAndGetAuthJWT(data.jwt);
    if(authRes===false)return beforeRooms;
    let idUser = authRes.id;
    let roomName = ROOM_NAME_PRIFIX.User+idUser;
    if(!io.sockets.adapter.sids[socket.id][roomName]) {
        //join
        socket.join(roomName);
        if(beforeRooms.indexOf(roomName)==-1){
            beforeRooms.push(roomName);
        }
    }
    return beforeRooms;
}
module.exports.JoinChanelChatRooms = async (io, socket, beforeRooms, data)=>{
    let idChanelChats = await getIdChanelChatsBaseJWT(data.jwt);
    //join rooms
    idChanelChats.forEach(element => {
        let roomName = ROOM_NAME_PRIFIX.ChanelChat+element;
        if(!io.sockets.adapter.sids[socket.id][roomName]) {
            //join
            socket.join(roomName);
            if(beforeRooms.indexOf(roomName)==-1){
                beforeRooms.push(roomName);
            }
        }
    });
    return beforeRooms;
}
const getIdChanelChatsBaseJWT = async (jwt)=>{
    let authRes = Auth.checkAndGetAuthJWT(jwt);
    if(authRes===false)return [];

    let idsRes = [];
    //room of chanel chat
    let roomsOfChanelChat = await ChanelChatController.getIdChanelChatsOfUser(idUser);
    roomsOfChanelChat.forEach((id_chanel_chat)=>{
        idsRes.push(id_chanel_chat);
    });
    return idsRes;
}
module.exports.OutRealChatChanelChatRoom = async (io, socket, beforeRooms, data)=>{
    let idChanelChats = await getIdChanelChatsBaseJWT(data.jwt);
    //check exit chanel chat
    if(idChanelChats.indexOf(data.id_chanel_chat)!=-1){
        let roomName = ROOM_NAME_PRIFIX.RealChatChanelChat+data.id_chanel_chat;
        if(io.sockets.adapter.sids[socket.id][roomName]) {
            //join
            socket.leave(roomName);
            let ind = beforeRooms.indexOf(roomName);
            if(ind!=-1){
                beforeRooms.splice(ind,1);
            }
        }
    }
    return beforeRooms;
}
module.exports.JoinRealChatChanelChatRoom = async (io, socket, beforeRooms, data)=>{
    let idChanelChats = await getIdChanelChatsBaseJWT(data.jwt);
    //check exit chanel chat
    if(idChanelChats.indexOf(data.id_chanel_chat)!=-1){
        let roomName = ROOM_NAME_PRIFIX.RealChatChanelChat+data.id_chanel_chat;
        if(!io.sockets.adapter.sids[socket.id][roomName]) {
            //join
            socket.join(roomName);
            if(beforeRooms.indexOf(roomName)==-1){
                beforeRooms.push(roomName);
            }
        }
    }
    return beforeRooms;
}
const OutRooms = (io, socket, rooms, data)=>{
    rooms.forEach(element => {
        if (io.sockets.adapter.sids[socket.id][element]) {
            //out
            socket.leave(element);
          }
    });
}
module.exports.OutRooms = OutRooms;

module.exports.SendToRoom = (io, roomName, event, data)=>{
    if(io.sockets.adapter.rooms[roomName]){
        io.to(roomName).emit(event, data);
    }
}