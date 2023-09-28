class GuestCV{
    name;
    id;
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}
module.exports.GuestCV = GuestCV;
class MyCV{
    name;
    id;
    isActive;
    constructor(id, name, isActive) {
        this.id = id;
        this.name = name;
        this.isActive = isActive;
    }
}
module.exports.MyCV = MyCV;
class Skill{
    name;
    id;
    image;
    constructor(id, name, image) {
        this.id = id;
        this.name = name;
        this.image = image;
    }
}
module.exports.Skill = Skill;
class Info{
    id;
    name;
    birthYear;
    maxim;
    description;
    contact;
    careerTarget;
    education;
    workExperience;
    constructor(
        id, name, birthYear,
        maxim = "",
        contact = "",
        careerTarget = "",
        education = "",
        workExperience = "",
        description = "",
    ) {
        this.id = id;
        this.name = name;
        this.birthYear = birthYear;
        this.maxim = maxim;
        this.contact = contact;
        this.careerTarget = careerTarget;
        this.education = education;
        this.workExperience = workExperience;
        this.description = description;
    }
}
module.exports.Info = Info;
module.exports.Relationship = {
    Guest: "guest",
    UserLogin: "userlogin",
    Friend: "friend",
    Leader: "leader",
    Owner: "owner",
    
};
class GuestProfile{
    relationship;
    avatar;
    info;
    skills=[];
    cvs=[];//guest cv
}
module.exports.GuestProfile = GuestProfile;
class MyProfile{
    avatar;
    info;
    skills=[];
    cvs=[];//my cv
}
module.exports.MyProfile = MyProfile;