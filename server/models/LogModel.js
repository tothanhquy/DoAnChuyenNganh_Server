const Message = require('../messages/Messages');
var mongoose = require('./ConnectDatabase');
const ModelResponse = require('./ModelResponse');
const ModelValid = require('./ModelValid');

//specify the fields which we want in our collection(table).  
var LogObjectSchema = new mongoose.Schema({  
    Id: {
        type: String,
        default:"",
    },
    Type: {
        type: String,
        required:true,
        default:"",
    },
 })  
var TimeRangeSchema = new mongoose.Schema({  
    Time: {
        type: Number,
        default:0,
    },
    TotalTimeVideo: {
        type: Number,
        default:0,
    },
}) 
var LogSchema = new mongoose.Schema({  
    ActionUser: {
        type:mongoose.Schema.Types.ObjectId, 
        ref: 'Accounts',
        required:true,
    },
    Time: {
        type: Number,
        default:0
    },
    TypeCode: {
        type: Number,
        default:0
    },
    MainObject: {
        type: LogObjectSchema,
        default:null,
    },
    SubObject: {
        type: LogObjectSchema,
        default:null,
    },
    SubObject2: {
        type: LogObjectSchema,
        default:null,
    },
    TimeRange: {
        type: TimeRangeSchema,
        default:null,
    },
 })  
  
 //here we saving our collectionSchema with the name user in database  
 //AccountModel will contain the instance of the user for manipulating the data.  
var LogModel = module.exports = mongoose.model('Logs',LogSchema)  
module.exports.LogObject = LogObjectSchema;

// module.exports.getDataById = async (id,languageMessage)=>{
//     try {
//         let resAction = await LogModel.findOne({ _id: id });
//         if (resAction == null) {
//             return ModelResponse.Fail(Message(languageMessage,"log_not_exist")); 
//         } else {
//             return ModelResponse.Success(resAction);
//         }
//     } catch (err) {
//         console.log(err)
//         return ModelResponse.Fail(Message(languageMessage,"system_error"));
//     } 
// }
module.exports.createLog = async function(newLog,languageMessage){ 
    try {
        // console.log(newLog)
        resAction = await LogModel.create(newLog);
        return ModelResponse.Success({id:resAction._id});
    } catch (err) {
        console.log(err)
        return ModelResponse.Fail(Message(languageMessage,"system_error"));
    }
}

module.exports.getLogAsObject=function(){
    return {
        ActionUser: null,
        Time: 0,
        TypeCode: 0,
        MainObject: null,
        SubObject: null,
        SubObject2: null,
        TimeRange: null,
    };
}
module.exports.getLogObjectAsObject=function(id,type){
    return {
        Id:id,
        Type:type
    };
}
module.exports.getTimeRangeAsObject=function(time,TotalTimeVideo=0){
    return {
        Time:time,
        TotalTimeVideo:TotalTimeVideo
    };
}
