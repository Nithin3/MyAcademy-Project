var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user.js");
var Cricketcamp = require("../models/cricketcamp.js");


//root route
router.get("/",function(req,res){
    res.render("home");
});

//Auth ROutes

//Show register form
router.get("/register",function(req,res){
    res.render("register");
});
//handle sign-up logic
router.post("/register",function(req,res){
    
    var newUser = new User({
        username:req.body.username,
        firstName:req.body.firstname,
        lastName:req.body.lastname,
        email:req.body.email,
        avatar:req.body.avatar
    });
    if(req.body.admincode === "Dpnaksagar1"){
        newUser.isAdmin = true;
    }
    User.register(newUser,req.body.password,function(err,user){
       if(err){
           req.flash("error",err.message);
           return res.render("register");
       }else{
           passport.authenticate("local")(req,res,function(){
                req.flash("success","Welcome to MyAcademy "+user.username);
              res.redirect("/cricketcamps"); 
           });
       } 
    });
});

//show login
router.get("/login",function(req,res){
    res.render("login");
});
//handles login logic
router.post("/login",passport.authenticate("local",
    {
        successRedirect:"/cricketcamps", 
        failureRedirect:"/login"
        
    }),function(req, res) {
    
});

//logout route
router.get("/logout",function(req,res){
    req.logout();
    req.flash("success","Logged You out! See you soon!");
    res.redirect("/cricketcamps");
});



//User Profile Route
router.get("/users/:id",function(req, res) {
   User.findById(req.params.id,function(err,foundUser){
       if(err){
           req.flash("error","Something went wrong!");
           res.redirect("/");
       }else{
           
           Cricketcamp.find().where('author.id').equals(foundUser._id).exec(function(err,cricketcamps){
                if(err){
                   req.flash("error","Something went wrong!");
                   res.redirect("/");
                }
                res.render("users/profile",{user:foundUser, cricketcamps:cricketcamps});
           })
           
       }
   }); 
});



module.exports = router;