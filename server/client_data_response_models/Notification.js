const StyleOfRange = module.exports.StyleOfRange = {
    Bold:"bold",
    Italic:"italic",
    Underline:"underline"
}
const StyleRange = module.exports.StyleRange = class{
    style;//StyleOfRange
    position;
    length;
    constructor(
        style="",
        position=0,
        length=0,
    ){
        this.style=style;
        this.position=position;
        this.length=length;
    }
}
const Notification = module.exports.Notification = class{
    id;
    content;
    time;
    wasRead;
    styleRanges;//StyleRange
    directLink;
    constructor(
        id="",
        content="",
        time=0,
        wasRead=false,
        styleRanges=[],
        directLink=null,
    ){
        this.id=id;
        this.content=content;
        this.time=time;
        this.wasRead=wasRead;
        this.styleRanges=styleRanges;
        this.directLink=directLink;
    }
}
const Notifications = module.exports.Notifications = class{
    notifications=[];//Notification
    isFinish=false;
    constructor(){}
}