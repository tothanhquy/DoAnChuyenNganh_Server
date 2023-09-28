const vi = require('./vi.json');
const en = require('./en.json');


function getMessage(language,message) {
    switch (language) {
        case "vi": {
            return vi[message] || "Message";
            break;
        }
        case "en": {
            return en[message] || "Message";
            break;
        }
        default:{
            return en[message] || "Message";
        }   
    }
}


module.exports = getMessage;