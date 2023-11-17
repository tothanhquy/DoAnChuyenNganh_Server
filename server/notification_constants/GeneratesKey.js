function genarateKey(typeNotification, mainObjectId){
    return ""+typeNotification+"_"+mainObjectId;
}
module.exports = genarateKey