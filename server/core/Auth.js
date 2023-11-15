const jwt = require('jsonwebtoken');
const Controller = require('../controllers/Controller');
const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
const AccountModel = require('../models/AccountModel');  

const JWT_SECRET = process.env.JWT_SECRET || '1f1asf1a4ff41afsgsmkfsm';
const COOKIE_LIFE = 1000 * 60 * 60 * 24 * 30 * 3;//3 month
const ACCESS_TOKEN_LIFE = 1000 * 60 * 60 * 24 * 30 * 3;//3 month

module.exports.AuthenUser = async (req, res, next) => {
    try {
        //get jwt from cookie
        const authCookie = req.cookies.auth;
        // const token = authCookie && authCookie.split(' ')[1];//'bearer abc'
        const token = authCookie;

        if (!token) {
            res.json(Controller.Fail(Message(req.lang,"not_authorized"),403));
        } else {
            let verifyData = await JWTVerify(token, JWT_SECRET);
            if (verifyData === false) {
                res.json(Controller.Fail(Message(req.lang,"not_authorized"),403));
            } else {
                let id = verifyData.id;
                let accessTokenString = verifyData.accessToken;
        
                //check in db
                let resAction = await AccountModel.getDataById(id, req.lang); 
                let account = resAction.data;
                if (
                    resAction.status === ModelResponse.ResStatus.Fail
                    || account.AccessTokens.indexOf(accessTokenString) ===-1
                    || account.BanTime > Date.now()
                ) {
                    res.json(Controller.Fail(Message(req.lang,"not_authorized"),403));
                }else{
                    let accessTokenOj = decodeAccessToken(accessTokenString);
                    if (accessTokenOj.time+ACCESS_TOKEN_LIFE < Date.now()) {
                        res.json(Controller.Fail(Message(req.lang,"not_authorized"),403));
                    } else {
                        req.user = verifyData;
                        req.user.userData.name = account.Name;
                        next();
                        
                    }
            
                }
                
            }
        }

    } catch (err) {
        res.json(Controller.Fail(Message(req.lang,"system_error")));
    }
};
 
module.exports.AuthenAdmin = async (req, res, next) => {
    try {
        //get jwt from cookie
        const authCookie = req.cookies.auth;
        // const token = authCookie && authCookie.split(' ')[1];//'bearer abc'
        const token = authCookie;
        // console.log(authCookie);
        if (!token || token == undefined) {
            
            res.redirect(req.baseUrl+"/../Account/Login");
        } else {
            let verifyData = await JWTVerify(token, JWT_SECRET);
            if (verifyData === false) {
                // console.log(1);
                res.redirect(req.baseUrl+"/../Account/Login");
            } else {
                let id = verifyData.id;
                let accessTokenString = verifyData.accessToken;
                // console.log(verifyData);
                //check in db
                let resAction = await AccountModel.getDataById(id, req.lang); 
                let account = resAction.data;
                // console.log(account);
                if (
                    resAction.status === ModelResponse.ResStatus.Fail
                    || account.AccessTokens.indexOf(accessTokenString) ===-1
                    || account.BanTime > Date.now()
                    || account.IsAdmin === false
                ) {
                    // console.log(2);
                    res.redirect(req.baseUrl+"/../Account/Login");
                }else{
                    let accessTokenOj = decodeAccessToken(accessTokenString);
                    if (accessTokenOj.time + ACCESS_TOKEN_LIFE < Date.now()) {
                        // console.log(3);
                        res.redirect(req.baseUrl+"/../Account/Login");
                    } else {
                        req.user = verifyData;
                        req.user.userData.name = account.Name;
                        next();
                        
                    }
            
                }
                
            }
        }

        

        
    } catch (err) {
        res.send("error");
    }
};
module.exports.CheckAndGetAuthenUser = async (req) => {
    try {
        //get jwt from cookie
        const authCookie = req.cookies.auth;
        // const token = authCookie && authCookie.split(' ')[1];//'bearer abc'
        const token = authCookie;

        if (!token) {
            return false;
        } else {
            return await checkAndGetAuthJWT(token,req.lang);
            // let verifyData = await JWTVerify(token, JWT_SECRET);
            // if (verifyData === false) {
            //     return false;
            // } else {
            //     let id = verifyData.id;
            //     let accessTokenString = verifyData.accessToken;
        
            //     //check in db
            //     let resAction = await AccountModel.getDataById(id, req.lang); 
            //     let account = resAction.data;
            //     if (
            //         resAction.status === ModelResponse.ResStatus.Fail
            //         || account.AccessTokens.indexOf(accessTokenString) ===-1
            //         || account.BanTime > Date.now()
            //     ) {
            //         return false;
            //     }else{
            //         let accessTokenOj = decodeAccessToken(accessTokenString);
            //         if (accessTokenOj.time + ACCESS_TOKEN_LIFE < Date.now()) {
            //             return false;
            //         } else {
            //             let result = verifyData;
            //             result.userData.name = account.Name;
            //             return result;
                        
            //         }
            
            //     }
                
            // }
        }

        

        
    } catch (err) {
        return false;
    }
};
const checkAndGetAuthJWT = async (jwt,lang='default')=>{
    let verifyData = await JWTVerify(jwt, JWT_SECRET);
    if (verifyData === false) {
        return false;
    } else {
        let id = verifyData.id;
        let accessTokenString = verifyData.accessToken;

        //check in db
        let resAction = await AccountModel.getDataById(id, lang); 
        let account = resAction.data;
        if (
            resAction.status === ModelResponse.ResStatus.Fail
            || account.AccessTokens.indexOf(accessTokenString) ===-1
            || account.BanTime > Date.now()
        ) {
            return false;
        }else{
            let accessTokenOj = decodeAccessToken(accessTokenString);
            if (accessTokenOj.time + ACCESS_TOKEN_LIFE < Date.now()) {
                return false;
            } else {
                let result = verifyData;
                result.userData.name = account.Name;
                return result;
                
            }
    
        }
        
    }
}
module.exports.checkAndGetAuthJWT = checkAndGetAuthJWT;
//return accessTokenString
module.exports.SetAuth = (id, userData, res) => {
    try {
        let accessToken = new AccessToken(Controller.generateRandomString(20), Date.now());
        let accessTokenString = encodeAccessToken(accessToken);
        const user = Object.assign(new UserCookie(id, accessTokenString, userData));
        //save token in cookie
        const token = jwt.sign({user}, JWT_SECRET);
        // console.log(token);
        res.cookie('auth', token, {
            maxAge: COOKIE_LIFE,
            httpOnly: true,
            secure: false,//https if true
            sameSite: 'strict'
        });

        return accessTokenString;
    } catch (err) {
        return false;
    }
};

const JWTVerify = async (token, JWT_SECRET) => {
    try {
        let data = await jwt.verify(token, JWT_SECRET);
        return data.user;
    } catch (err) {
        return false;
    }
};
class UserCookie{
    id;
    accessToken;
    userData;
    constructor(id,token,data){
        this.id = id;
        this.accessToken = token;
        this.userData = data;
    }
}
class AccessToken{
    token; 
    time;
    constructor(token, time) {
        this.token = token;
        this.time = time;
    }
}
var encodeAccessToken = function (accessToken) {
    return accessToken.token + "." + accessToken.time;
}
var decodeAccessToken = function (accessTokenString) {
    try {
        let arr = accessTokenString.split('.');
        if (isNaN(parseInt(arr[1]))) return null;
        return new AccessToken(arr[0],parseInt(arr[1]));
    } catch {
        return null;
    }
}