const AlertStatus = module.exports.Status = {
    Success: "success",
    Danger: "danger",
    Warning: "warning",
    Info:"info"
}

class Alert{
    status;
    message;
    constructor(status, message) {
        this.status = status;
        this.message = message;
    }
}

module.exports.Success = function (message) {
    return new Alert(AlertStatus.Success, message);
}
module.exports.Danger = function (message) {
    return new Alert(AlertStatus.Danger, message);
}
module.exports.Warning = function (message) {
    return new Alert(AlertStatus.Warning, message);
}
module.exports.Info = function (message) {
    return new Alert(AlertStatus.Info, message);
}