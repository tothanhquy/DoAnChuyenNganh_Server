const bcrypt = require('bcrypt');

const Message = require('../../messages/Messages');
const ModelResponse = require('../../models/ModelResponse');
var AccountModel = require('../../models/AccountModel');  
var Controller = require('../Controller');
// const Mail = require('../../core/Mail');

//containt the function with business logics  
var AccountController = { 

    //http get
    Dashboard: async (req,res) => {
        try {  
            // if ((await Controller.isAuthorizeAdmin(req)) == false) {
            //     res.redirect("../Account/Login");  
            // }

            // let accessToken = Controller.getAccessToken(req);

            // let resAction = await AccountModel.getDataById(accessToken.id,req.lang);
            // let account = resAction.data;
            // if (resAction.status == ModelResponse.ResStatus.Fail) {
            //     res.send("Error");    
            // }
            // Mail.Send();
            let accountName = req.user.userData.name;
            res.render('dashboard', { req: req, title: 'Dashboard', admin_name: accountName });
        }  
        catch (error) {  
            res.send("Error");   
        }  
    },
    
}  
  
module.exports = AccountController;