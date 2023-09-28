const Message = require('../messages/Messages');
const ModelResponse = require('../models/ModelResponse');
var SkillModel = require('../models/SkillModel');  
var Controller = require('./Controller');

//containt the function with business logics  
var SkillController = { 

    //http get
    GetSkills: async (req,res) => {
        try {
            resAction = await SkillModel.getAllSkillsByUser(req.lang);
            if (resAction.status == ModelResponse.ResStatus.Fail) {
                res.json(Controller.Fail(resAction.error));
                return;
            }
            let skills = resAction.data.map(a=> ({id:a._id,name:a.Name,image:a.Image})) || [];
            
            res.json(Controller.Success({ skills:skills }));  
        }  
        catch (error) {  
            res.json(Controller.Fail(Message(req.lang, "system_error")));  
        }  
    },
}  

module.exports = SkillController;