const Room = require('./Room');
const SocketEventNames = require('./SocketEventNames');

module.exports.MainSocket = (io, socket)=>{
    let roomsOfThisSocket = [];

    //rooms
    socket.on(SocketEventNames.RECEIVE.JoinPersonalRoom, async (data)=>{
        Room.OutRooms(io, socket, roomsOfThisSocket, data);
        roomsOfThisSocket = [];
        roomsOfThisSocket = await Room.JoinPersonalRoom(io, socket, roomsOfThisSocket, data);
    });
    socket.on(SocketEventNames.RECEIVE.JoinChanelChatRooms, async (data)=>{
        roomsOfThisSocket = await Room.JoinChanelChatRooms(io, socket, roomsOfThisSocket, data);
    });
    socket.on(SocketEventNames.RECEIVE.JoinRealChatChanelChatRooms, async (data)=>{
        roomsOfThisSocket = await Room.JoinRealChatChanelChatRoom(io, socket, roomsOfThisSocket, data);
    });
    socket.on(SocketEventNames.RECEIVE.OutRealChatChanelChatRooms, async (data)=>{
        roomsOfThisSocket = await Room.OutRealChatChanelChatRoom(io, socket, roomsOfThisSocket, data);
    });
    socket.on(SocketEventNames.RECEIVE.OutAllRoom,(data)=>{
        Room.OutRooms(io, socket, roomsOfThisSocket, data);
        roomsOfThisSocket = [];
    });

    //disconnect
    socket.on("disconnecting",()=>{
        //rooms auto out
        roomsOfThisSocket = [];
    });
    socket.on("disconnect",()=>{
        //rooms auto out
        roomsOfThisSocket = [];
    });

    
}