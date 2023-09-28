const ResStatus = module.exports.ResStatus = {
    Success: "Success",
    Fail:"Fail",
}

class Response{
    code; 
    status; 
    error;
    data;
    constructor(code, status, error, data) {
        this.code = code;
        this.status = status;
        this.error = error;
        this.data = data;
    }
}


module.exports.Success = function (data) {
    return new Response(0, ResStatus.Success, null, data);
}
module.exports.Fail = function (error) {
    return new Response(0, ResStatus.Fail, error, null);
}