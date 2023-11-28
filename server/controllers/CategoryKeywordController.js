const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var CategoryKeywordModel = require('../models/CategoryKeywordModel');  
var Controller = require('./Controller');
const ProjectResponse = require("../client_data_response_models/Project");

//containt the function with business logics  
var CategoryKeywordController = { 

    //http get
    GetList: async (req,res) => {
        try {
            resAction = await CategoryKeywordModel.getAllCategoryKeywordsByUser(req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let items = resAction.data.map(a=> ({id:a._id,name:a.Name})) || [];
            //sort by name, inscrease
            items.sort((a, b) => Controller.sortFunc(a.name, b.name, -1));

            let resObject = new  ProjectResponse.CategoryKeywordList();
            resObject.keywords = items;
            res.json(Controller.Success(resObject));  
        }  
        catch (error) {  
            res.json(Controller.Fail(Message(req.lang, "system_error")));  
        }  
    },
}  

module.exports = CategoryKeywordController;