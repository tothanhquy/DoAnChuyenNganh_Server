var mongoose = require('mongoose')  
mongoose.connect(process.env.MONGOOSE_URL,{useNewUrlParser:true})  
// mongoose.connect('mongodb+srv://AdminStartupMap:d3YLMKRKRC8SvTeu@cluster0.dxxzgvk.mongodb.net/?retryWrites=true&w=majority',{useNewUrlParser:true})  
  .then(
    () => console.log('connected to database')
  ).catch(error => console.log('error occured', error))  
module.exports= mongoose;