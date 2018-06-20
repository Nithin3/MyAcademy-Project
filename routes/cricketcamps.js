var express = require("express");
var router = express.Router();
var Cricketcamp = require("../models/cricketcamp.js");
var middleware = require("../middleware/index.js");

var multer = require('multer');
var storage = multer.diskStorage({
    filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'drty4xagm', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//INDEX Route - Show all Cricket Camps
router.get("/cricketcamps",function(req,res){
    
    var noMatch;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        
        Cricketcamp.find({name:regex},function(err,allCricketcamps){
        
        if(err){
             console.log(err);
        }else{  
                
                if(allCricketcamps.length<1){
                    noMatch = "There are no cricket academies with that name. Please try again!";
                }
                res.render("cricketcamps/index",{messageNoMatch: noMatch,cricketcamps: allCricketcamps,currentUser:req.user});
            }  
        });
    }else{
        Cricketcamp.find({},function(err,allCricketcamps){
        if(err){
             console.log(err);
        }else{
            res.render("cricketcamps/index",{cricketcamps: allCricketcamps,currentUser:req.user,messageNoMatch:noMatch});
            }  
        });
       
    }
   
});

//Create Route - Add new cricketCamp to the DB
router.post("/cricketcamps",middleware.isLoggedIn,upload.single('image'),function(req,res){
    
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        }
        
        cloudinary.v2.uploader.upload(req.file.path, function(err, result){ 
            
            if(err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            Cricketcamp.create(
                {
                    name:req.body.name,
                    image:result.secure_url,
                    imageId:result.public_id,
                    description:req.body.description,
                    fee: req.body.fee,
                    location:data[0].formattedAddress,
                    lat:data[0].latitude,
                    lng:data[0].longitude,
                    author:{
                        id:req.user._id,
                        username:req.user.username
                    }
                    
                },function(err,cricketcamp){
                    if(err){
                        console.log(err);
                    }else{
                        
                        res.redirect("/cricketcamps");
                    }
            });
        
        });
    });
    
});

//NEW-Show form to create a new circket camp
router.get("/cricketcamps/new",middleware.isLoggedIn,function(req, res) {
    res.render("cricketcamps/new");    
});

//Show - show more about one cricket camp
router.get("/cricketcamps/:id",function(req, res){
    
     Cricketcamp.findById(req.params.id).populate("comments").exec(function(err,foundCricketcamp){
         if(err){
             console.log(err);
         }else{
            
             res.render("cricketcamps/show",{cricketcamp:foundCricketcamp});
         }
     });
});

//Edit CricketCamp Route
router.get("/cricketcamps/:id/edit",middleware.ensureCricketcampOwnership,function(req, res) {
        Cricketcamp.findById(req.params.id,function(err,foundCricketcamp){
                res.render("cricketcamps/edit",{cricketcamp:foundCricketcamp});    
        }
   );

});

router.put("/cricketcamps/:id",middleware.ensureCricketcampOwnership,upload.single('image'),function(req,res){
    
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        }
       
       Cricketcamp.findById(req.params.id, async function(err,cricketcamp){
           if(err){
                req.flash('error', err.message);
                return res.redirect('back');
           }else{
               if(req.file){
                   try{
                       await cloudinary.v2.uploader.destroy(cricketcamp.imageId);
                       var result = await cloudinary.v2.uploader.upload(req.file.path); 
                        
                        cricketcamp.image = result.secure_url;
                        cricketcamp.imageId = result.public_id;
                    
                   }catch(err){
                        req.flash('error', err.message);
                        return res.redirect('back');
                   }
                  
                }
                
                req.body.cricketcamp.lat = data[0].latitude;
                req.body.cricketcamp.lng = data[0].longitude;
                req.body.cricketcamp.location = data[0].formattedAddress;
                
                cricketcamp.name = req.body.cricketcamp.name;
                cricketcamp.description = req.body.cricketcamp.description;
                cricketcamp.fee = req.body.cricketcamp.fee;
                cricketcamp.lat = req.body.cricketcamp.lat;
                cricketcamp.lng = req.body.cricketcamp.lng;
                cricketcamp.location = req.body.cricketcamp.location;
                cricketcamp.save();
                
               req.flash("success","Successfully Updated");
               res.redirect("/cricketcamps/"+req.params.id);
           }
       }); 
    });
});

//Destroy Route
router.delete("/cricketcamps/:id",middleware.ensureCricketcampOwnership,function(req,res){
    
    Cricketcamp.findById(req.params.id,function(err,cricketcamp){
        if(err){
            req.flash('error', err.message);
            return res.redirect('back');
        }
        cloudinary.v2.uploader.destroy(cricketcamp.imageId);
    });
    Cricketcamp.findByIdAndRemove(req.params.id,function(err,updatedCricketcamp){
       if(err){
           req.flash('error', err.message);
           return res.redirect('back');
       }else{
           res.redirect("/cricketcamps");
       }
   });  
});

function escapeRegex(text){
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
module.exports = router;