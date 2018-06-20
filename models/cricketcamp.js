var mongoose = require("mongoose");

//Schema Setup
var cricketcampSchema = new mongoose.Schema({
    name: String,
    image: String,
    imageId: String,
    description:String,
    fee : String,
    location:String,
    lat:Number,
    lng:Number,
    createdAt: {type:Date,default:Date.now},
    comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ],
   
   author:{
       id: mongoose.Schema.Types.ObjectId,
       username:String
   }
});

module.exports =  mongoose.model("Cricketcamp",cricketcampSchema);


