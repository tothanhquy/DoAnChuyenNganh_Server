module.exports.BasicDataUser = class{
    name="";
    avatar="";
    isVerifyEmail=false;
    numberNotReadNotifications=0;
    constructor(
        name="",
        avatar="",
        isVerifyEmail=false,
        numberNotReadNotifications=0
    ){
        this.name=name;
        this.avatar=avatar;
        this.isVerifyEmail=isVerifyEmail;
        this.numberNotReadNotifications=numberNotReadNotifications;
    }
}