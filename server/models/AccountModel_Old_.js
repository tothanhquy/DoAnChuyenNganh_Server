const bcrypt = require('bcrypt');

const Message = require('../messages/Messages');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');

//specify the fields which we want in our collection(table).  
var AccountSchema = new mongoose.Schema({  
    Name: {
        type: String,
        required:true
    },  
    Avatar: {
        type:String
    },
    Email: {
        type: String,
        required: true,
        unique: true
    },
    Password: {
        type: String,
        required:true
    },
    AccessToken: {
        type: String,
        default:""
    },  
    Maxim: String,  
    Desription: String,  
    role: {
        type: String,
        required:true,
        default:'user'
    }, 
    IsVerifyEmail: {
        type: Boolean,
        required: true,
        default:false,
    },
    VerifyEmailToken: String,
    ResetPasswordAcceccToken: String
 })  
  
 //here we saving our collectionSchema with the name user in database  
 //AccountModel will contain the instance of the user for manipulating the data.  
var AccountModel = module.exports = mongoose.model('Accounts',AccountSchema)  



module.exports.registerAccount = async function(newAccount){ 
    try {
        let emailValid = isValidEmail(newAccount.Email);
        if (!emailValid.isValid) {
            return ModelResponse.Fail(emailValid.error);
        }
        let nameValid = isValidName(newAccount.Name);
        if (!nameValid.isValid) {
            return ModelResponse.Fail(nameValid.error);
        }
                

        //check exist email
        let resAction = await AccountModel.findOne({ Email: newAccount.Email }, { _id: 1 });
        if (resAction != null) {
            //exist
            return ModelResponse.Fail("Email đã được người khác đăng ký.");
        }
        const account = new AccountModel({
            Name: newAccount.Name,
            Email: newAccount.Email,
            Password: newAccount.Password,
            VerifyEmailToken: "",
            Role: 'user',
            IsVerifyEmail:false,
        });  
        resAction = await AccountModel.create(account);
        return ModelResponse.Success({id:resAction._id});
    } catch (err) {
        return ModelResponse.Fail(Message(req.lang,"system_error"));
    }
}
module.exports.getIsVerifyEmail = async (id) => {  
    try {
        let resAction = await AccountModel.findOne({ _id: id }, { IsVerifyEmail: 1});
        if (resAction == null) {
            return ModelResponse.Fail("Tài khoản không tồn tại"); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        return ModelResponse.Fail(Message(req.lang,"system_error"));
    }  
} 
module.exports.setVerifyEmailToken = async (id,verifyToken) => {  
    try {
        let resAction = await AccountModel.updateOne({ _id: id }, { VerifyEmailToken:verifyToken});
        if (resAction.matchedCount != 1) {
            return ModelResponse.Fail("Tài khoản không tồn tại");
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        return ModelResponse.Fail(Message(req.lang,"system_error"));
    }
     
}
module.exports.getVerifyEmailTokenByEmail = async (email) => {  
    try {
        let resAction = await AccountModel.findOne({ Email: email }, { VerifyEmailToken: 1, _id: 1 });
        if (resAction == null) {
            return ModelResponse.Fail("Tài khoản không tồn tại"); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        return ModelResponse.Fail(Message(req.lang,"system_error"));
    }  
} 
module.exports.verifyEmailComplete = async (id) => {  
    try {
        let resAction = await AccountModel.updateOne({ _id: id }, { IsVerifyEmail: true, VerifyEmailToken:""});
        if (resAction.matchedCount != 1) {
            return ModelResponse.Fail("Tài khoản không tồn tại");
        } else {
            return ModelResponse.Success({isComplete: true});
        }
            
    } catch (err) {
        return ModelResponse.Fail(Message(req.lang,"system_error"));
    }  
} 
module.exports.getPasswordByEmail = async (email) => {  
    try { 
        let resAction = await AccountModel.findOne({ Email: email }, { Password: 1, _id: 1 });
        if (resAction == null) {
            return ModelResponse.Fail("Tài khoản không tồn tại"); 
        } else {
            return ModelResponse.Success(resAction);
        }
    
    } catch (err) {
        return ModelResponse.Fail(Message(req.lang,"system_error"));
    }
     
} 

module.exports.updateAccessToken = async (id,AccessToken) => {  
    try {
        let resAction = await AccountModel.updateOne({ _id: id }, { AccessToken:AccessToken});
        if (resAction.matchedCount != 1) {
            return ModelResponse.Fail("Tài khoản không tồn tại");
        } else {
            return ModelResponse.Success({isComplete: true});
        }
    } catch (err) {
        return ModelResponse.Fail(Message(req.lang,"system_error"));
    }
     
}

module.exports.getAccessTokenById = async (id) => {  
    try {
        let resAction = await AccountModel.findOne({ _id: id }, { AccessToken: 1, _id: 0 });
        if (resAction == null) {
            return ModelResponse.Fail("Tài khoản không tồn tại"); 
        } else {
            return ModelResponse.Success(resAction.AccessToken);
        }
    } catch (err) {
        return ModelResponse.Fail(Message(req.lang,"system_error"));
    }
     
}
module.exports.getRole = async (id) => {  
    try {
        let resAction = await AccountModel.findOne({ _id: id }, { Role: 1});
        if (resAction == null) {
            return ModelResponse.Fail("Tài khoản không tồn tại"); 
        } else {
            return ModelResponse.Success(resAction);
        }
            
    } catch (err) {
        return ModelResponse.Fail(Message(req.lang,"system_error"));
    }  
} 

var isValidEmail = module.exports.isValidEmail=function(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9._]+\.[a-zA-Z]{2,}$/;
    if (emailRegex.test(email)) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(`
Email chuẩn cần có định dạng: <username>@<domain>.<tên miền>. 
Bắt đầu bằng một hoặc nhiều ký tự chữ cái, số, dấu gạch dưới (_) hoặc dấu chấm (.).
Tiếp đó là một ký tự '@'.
Tiếp theo là một hoặc nhiều ký tự chữ cái, số hoặc dấu gạch dưới.
Sau đó là một dấu chấm (.) và một hoặc hai ký tự chữ cái, ví dụ: .com, .edu, .gov, .org, .net, .info, .biz, .io, ...
Địa chỉ email không chứa khoảng trắng hoặc ký tự đặc biệt ngoài dấu gạch dưới (_) hoặc dấu chấm (.).`
        );
    }
}
var isValidPassword = module.exports.isValidPassword=function(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&])[A-Za-z\d@$!%?&]{8,}$/;
    if (passwordRegex.test(password)) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid(`
Mật Khẩu:
Ít nhất 8 ký tự.
Chứa ít nhất một chữ hoa và một chữ thường.
Chứa ít nhất một chữ số và một ký tự đặc biệt.`
        );
    }
}
var isValidName = module.exports.isValidName = function(name=" ") {
    if (name.length >= 0 && name.length <= 50) {
        return ModelValid.Valid();
    } else {
        return ModelValid.Invalid("\nChiều dài tên tối thiểu 1 và tối đa 50 ký tự.");
    }
}

module.exports.RegisterTime = 10 * 60 * 1000;//10 minus
module.exports.AccessTokenTime = 30 * 24 * 60 * 60 * 1000;//1 month

module.exports.hashPassword = async function (password) {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
}