const vi = require('./vi.json');
const en = require('./en.json');


function getMessage(language,message) {
    switch (language) {
        case "vi": {
            return vi[message] || vi["default_message"];
            break;
        }
        case "en": {
            return en[message] || en["default_message"];
            break;
        }
        default:{
            return en[message] || en["default_message"];
        }   
    }
}


module.exports = getMessage;