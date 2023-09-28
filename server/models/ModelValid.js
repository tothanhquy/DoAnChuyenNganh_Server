module.exports.Valid = function () {
    return {
        isValid:true
    };
}
module.exports.Invalid = function (error) {
    return {
        isValid: false,
        error:error
    };
}