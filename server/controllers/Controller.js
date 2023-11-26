const ModelResponse = require('../models/ModelResponse');
var AccountModel = require('../models/AccountModel'); 
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;

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

module.exports.Success = function (data,code=0) {
    return new Response(code, ResStatus.Success, null, data);
}
module.exports.Fail = function (error,code=0) {
    return new Response(code, ResStatus.Fail, error, null);
}

class AccessToken{
    id; 
    token; 
    time;
    constructor(id, token, time) {
        this.id = id;
        this.token = token;
        this.time = time;
    }
}
module.exports.AccessToken = AccessToken;
var encodeAccessToken = module.exports.AccessToken.encode = function (accessToken) {
    return accessToken.id + "." + accessToken.token + "." + accessToken.time;
}
var decodeAccessToken = module.exports.AccessToken.decode = function (accessTokenString) {
    try {
        let arr = accessTokenString.split('.');
        if (parseInt(arr[2]) == null) return null;
        return new AccessToken(arr[0],arr[1],parseInt(arr[2]));
    } catch {
        return null;
    }
}

var getAccessToken = module.exports.getAccessToken = (req) => {
    try {
        if (!req.session.access_token && !req.body.access_token) {
            return null;
        }
        let accessTokenString = req.body.access_token||req.session.access_token;    
        let accessToken = decodeAccessToken(accessTokenString);
        return accessToken;
    } catch (err) {
        return null;
    }
}

module.exports.setAccessToken = (req,accessToken) => {
    try {
        req.session.access_token = encodeAccessToken(accessToken);
        return true;
    } catch (err) {
        return false;
    }
}
    
module.exports.isAuthorize = async function (req) {
    try {
        let accessToken = getAccessToken(req);
        if (accessToken==null) {
            return false;
        }
        let resAction = await AccountModel.getDataById(accessToken.id,req.lang); 
        if (resAction.status == ModelResponse.ResStatus.Fail) {
            return false;
        }
        if (resAction.data.AccessToken != encodeAccessToken(accessToken)) {
            return false;
        }
        if (accessToken.time < Date.now()) {
            return false;
        }
        return true;
    } catch (err) {
        return false;
    }

}
module.exports.isAuthorizeAdmin = async function (req) {
    try {
        let accessToken = getAccessToken(req);
        if (accessToken==null) {
            return false;
        }
        let resAction = await AccountModel.getDataById(accessToken.id,req.lang); 
        if (resAction.status == ModelResponse.ResStatus.Fail) {
            return false;
        }
        if (resAction.data.AccessToken != encodeAccessToken(accessToken)) {
            return false;
        }
        if (accessToken.time < Date.now()) {
            return false;
        }
        if (resAction.data.Role == "admin") {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        return false;
    }

}

module.exports.generateRandomString =function(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports.createDirectory = async function (path) {
    try {
        let res = await fsPromises.mkdir(path);
        return true;
    } catch (err) {
        return false;
    }
}
module.exports.deleteAllFilesInDirectory = async function (pathDir) {
    try {
        let files = await fsPromises.readdir(pathDir);
        let check = true;
        for (let file of files) {
            check = await deleteFile(path.join(pathDir, file));
            if (!check) return false;
        }
        return true;
    } catch (err) {
        return false;
    }
}
const deleteFile = module.exports.deleteFile = function (path) {
    try {
        fs.unlinkSync(path);
        return true;
    } catch (err) {
        return false;
    }
}
module.exports.isExistPath = function (path) {
    try {
        return fs.existsSync(path);
    } catch (err) {
        return false;
    }
}

//incDes: inc:-1 des:1
module.exports.sortFunc = function(a, b, incDes){
    if (a < b) {
        return incDes;
    }
    if (a > b) {
        return incDes * -1;
    }
    return 0;
}

module.exports.isStringArray = function (arr) {
    if (arr.length == 0) return true;
    return (arr) => arr.every((item) => typeof item === 'string');
}
module.exports.toNonAccentVietnamese = function(str) {
    str = str.replace(/A|Á|À|Ã|Ạ|Â|Ấ|Ầ|Ẫ|Ậ|Ă|Ắ|Ằ|Ẵ|Ặ/g, "A");
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/E|É|È|Ẽ|Ẹ|Ê|Ế|Ề|Ễ|Ệ/, "E");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/I|Í|Ì|Ĩ|Ị/g, "I");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/O|Ó|Ò|Õ|Ọ|Ô|Ố|Ồ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ỡ|Ợ/g, "O");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/U|Ú|Ù|Ũ|Ụ|Ư|Ứ|Ừ|Ữ|Ự/g, "U");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/Y|Ý|Ỳ|Ỹ|Ỵ/g, "Y");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/Đ/g, "D");
    str = str.replace(/đ/g, "d");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng 
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
    return str;
}
module.exports.Constant = {
    CV_PDF_FILE_LIMIT_KB : 1024*5 // 5 mb
    ,USER_AVATAR_FILE_LIMIT_KB : 1024*5 // 5 mb
    ,TEAM_AVATAR_FILE_LIMIT_KB : 1024*5 // 5 mb
    ,GROUP_CHAT_AVATAR_FILE_LIMIT_KB : 1024*5 // 5 mb
    ,PROJECT_AVATAR_FILE_LIMIT_KB : 1024*5 // 5 mb
    ,PROJECT_IMAGE_RESOURCE_LIMIT_KB : 1024*5 // 5 mb
    ,PROJECT_VIDEO_RESOURCE_LIMIT_KB : 1024*30 // 30 mb
}