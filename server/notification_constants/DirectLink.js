const ChanelChat={
    Details:(id)=>"chanelchat/details/"+id,
}
const Friend={
    Request:{
        Details:(id)=>"friend/request/details/"+id,
    }
}
const Account={
    Details:(id)=>"account/details/"+id,
}
const Team={
    Details:(id)=>"team/details/"+id,
    Members:(id)=>"team/members/"+id,
}
const Project={
    Details:(id)=>"project/details/"+id,
    Members:(id)=>"project/members/"+id,
    RequestsOfUser:()=>"project/request_of_user",
}
const Post={
    Details:(id)=>"post/details/"+id,
}
// const TeamRequest={
//     Details:(id)=>"TeamRequest/details/"+id,
// }
module.exports = {
    ChanelChat:ChanelChat,
    Friend:Friend,
    Account:Account,
    Team:Team,
    Project:Project,
    Post:Post,
    // TeamRequest:TeamRequest,

}