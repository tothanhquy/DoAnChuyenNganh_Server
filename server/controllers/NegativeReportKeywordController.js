const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var NegativeReportKeywordModel = require('../models/NegativeReportKeywordModel');  
var Controller = require('./Controller');

//containt the function with business logics  
var NegativeReportKeywordController = { 

    //http get
    GetList: async (req,res) => {
        try {
            resAction = await NegativeReportKeywordModel.getAllNegativeReportKeywordsByUser(req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let items = resAction.data.map(a=> ({id:a._id,name:a.Name})) || [];
            
            res.json(Controller.Success({ keywords:items }));  
        }  
        catch (error) {  
            res.json(Controller.Fail(Message(req.lang, "system_error")));  
        }  
    },
}  

module.exports = NegativeReportKeywordController;