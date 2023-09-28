
class AdminUserEdit{
    _id;
    Name;
    Email;
    BanTime;
    BanTimeString;
    constructor(user) {
        this._id = user._id;
        this.Name = user.Name;
        this.Email = user.Email;
        this.BanTime = user.BanTime;
        // this.BanTimeString = (new Date(user.BanTime)).toUTCString();
        this.BanTimeString = (new Date(user.BanTime)).toISOString().slice(0, 16);
    }
}
module.exports = function (user) {
    return new AdminUserEdit(user);
}