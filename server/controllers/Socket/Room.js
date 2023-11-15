const Auth = require('../../core/Auth');
const ChanelChatController = require('../ChanelChatController');

const ROOM_NAME_PRIFIX = {
    User:"user-",
    ChanelChat:"chanel-chat-",
    RealChatChanelChat:"real-chat-chanel-chat-",
}
module.exports.ROOM_NAME_PRIFIX = ROOM_NAME_PRIFIX;
const jsonToObject = function(json){
    try{
        return JSON.parse(json);
    }catch(err){
        return undefined;
    }
}
module.exports.JoinPersonalRoom = async (io, socket, beforeRooms, data)=>{
    try{
        let reqData = jsonToObject(data);
        let authRes = await Auth.checkAndGetAuthJWT(reqData.jwt);
        if(authRes===false)return beforeRooms;
        let idUser = authRes.id;
        let roomName = ROOM_NAME_PRIFIX.User+idUser;
        if(!io.sockets.adapter.rooms.has(roomName)||!io.sockets.adapter.rooms.get(roomName).has(socket.id)) {
            //join
            socket.join(roomName);
            if(beforeRooms.indexOf(roomName)==-1){
                beforeRooms.push(roomName);
            }
        }
        return beforeRooms;
    }catch(err){
        console.log(err)
        return beforeRooms;
    }
}
module.exports.JoinChanelChatRooms = async (io, socket, beforeRooms, data)=>{
    try{
        let reqData = jsonToObject(data);
        let idChanelChats = await getIdChanelChatsBaseJWT(reqData.jwt);
        //join rooms
        idChanelChats.forEach(element => {
            let roomName = ROOM_NAME_PRIFIX.ChanelChat+element;
            if(!io.sockets.adapter.rooms.has(roomName)||!io.sockets.adapter.rooms.get(roomName).has(socket.id)) {
                //join
                socket.join(roomName);
                if(beforeRooms.indexOf(roomName)==-1){
                    beforeRooms.push(roomName);
                }
            }
        });
        return beforeRooms;
    }catch(err){
        console.log(err)
        return beforeRooms;
    }
}
const getIdChanelChatsBaseJWT = async (jwt)=>{
    let authRes = await Auth.checkAndGetAuthJWT(jwt);
    if(authRes===false)return [];
    let idUser = authRes.id;
    let idsRes = [];
    //room of chanel chat
    let roomsOfChanelChat = await ChanelChatController.getIdChanelChatsOfUser(idUser);
    roomsOfChanelChat.forEach((id_chanel_chat)=>{
        idsRes.push(id_chanel_chat.toString());
    });
    return idsRes;
}
module.exports.OutRealChatChanelChatRoom = async (io, socket, beforeRooms, data)=>{
    try{
        let reqData = jsonToObject(data);
        let idChanelChats = await getIdChanelChatsBaseJWT(reqData.jwt);
        //check exit chanel chat
        if(idChanelChats.indexOf(reqData.data.id_chanel_chat)!=-1){
            let roomName = ROOM_NAME_PRIFIX.RealChatChanelChat+reqData.data.id_chanel_chat;
            if(io.sockets.adapter.rooms.has(roomName)&&io.sockets.adapter.rooms.get(roomName).has(socket.id)) {
                //join
                socket.leave(roomName);
                let ind = beforeRooms.indexOf(roomName);
                if(ind!=-1){
                    beforeRooms.splice(ind,1);
                }
            }
        }
        return beforeRooms;
    }catch(err){
        console.log(err)
        return beforeRooms;
    }
}
module.exports.JoinRealChatChanelChatRoom = async (io, socket, beforeRooms, data)=>{
    try{
        let reqData = jsonToObject(data);
        let idChanelChats = await getIdChanelChatsBaseJWT(reqData.jwt);
        //check exit chanel chat
        if(idChanelChats.indexOf(reqData.data.id_chanel_chat)!=-1){
            let roomName = ROOM_NAME_PRIFIX.RealChatChanelChat+reqData.data.id_chanel_chat;
            if(!io.sockets.adapter.rooms.has(roomName)||!io.sockets.adapter.rooms.get(roomName).has(socket.id)) {
                //join
                socket.join(roomName);
                if(beforeRooms.indexOf(roomName)==-1){
                    beforeRooms.push(roomName);
                }
            }
        }
        return beforeRooms;
    }catch(err){
        console.log(err)
        return beforeRooms;
    }
}
const OutRooms = (io, socket, rooms, data)=>{
    try{
        rooms.forEach(element => {
            if(io.sockets.adapter.rooms.has(element)&&io.sockets.adapter.rooms.get(element).has(socket.id)) {
                //out
                socket.leave(element);
            }
        });
    }catch(err){
        console.log(err)
    }
}
module.exports.OutRooms = OutRooms;

module.exports.SendToRoom = (io, roomName, event, data)=>{
    try{
        console.log(roomName)
        if(io.sockets.adapter.rooms.has(roomName)){
            io.to(roomName).emit(event, JSON.stringify(data));
            console.log("data of room:"+roomName + ":"+JSON.stringify(data))
        }
    }catch(err){
        console.log(err)
    }
}