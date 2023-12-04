const GeneratesKey = require("./GeneratesKey")
const TypeObject = require("./TypeObject")
const DirectLink = require("./DirectLink")
const TypeNotification = require("./TypeNotification")
const Messages = require("./MessageNotification/Messages")
const GrammarObject = require("./MessageNotification/GrammarObject")

module.exports.TypeObject = TypeObject;
module.exports.DirectLink = DirectLink;
module.exports.GrammarObject = GrammarObject;
module.exports.generatesKey = GeneratesKey;
module.exports.TypeNotification = TypeNotification;
module.exports.getMessageByCode = function(languageMessage, code){
    for(let keyParent in TypeNotification){
        for(let keyChild in TypeNotification[keyParent]){
            if(TypeNotification[keyParent][keyChild].Code==code){
                return Messages(languageMessage, TypeNotification[keyParent][keyChild].Message);
            }
        }
    }
    
    return Messages(languageMessage, "default_message");
}
module.exports.getMessage = function(languageMessage, message){
    return Messages(languageMessage, message);
}