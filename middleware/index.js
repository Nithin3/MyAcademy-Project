//All the middleware goes here
var middleware = {};
var Cricketcamp = require("../models/cricketcamp.js");
var Comment = require("../models/comment.js");

middleware.ensureCricketcampOwnership = function(req,res,next){
    
    if(req.isAuthenticated()){
        
        Cricketcamp.findById(req.params.id,function(err,foundCricketcamp){
        
        if(err){
            req.flash("error","Academy not found!");   
            res.redirect("back");
        }else{
            if(foundCricketcamp.author.id.equals(req.user._id) || req.user.isAdmin){
                next();  
            }else{
                `req.flash("error","You do not have permission to do that!");`        
                res.redirect("back");
            }
        }
   });
    }else{
        req.flash("error","You need to be logged in to do that!");
        res.redirect("back");
    }

};

middleware.ensureCommentOwnership = function(req,res,next){

    
    if(req.isAuthenticated()){
        
        Comment.findById(req.params.comment_id,function(err,foundComment){
        
        if(err){
           res.redirect("back");
        }else{
            if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
                next();  
            }else{
                 req.flash("error","You do not have permission to do that!");
                res.redirect("back");
            }
        }
   });
    }else{
        req.flash("error","You need to be logged in to do that!");
        res.redirect("back");
    }
   
};

middleware.isLoggedIn = function(req,res,next){
    
    if(req.isAuthenticated()){
        return next();
    }else{
        req.flash("error","You need to be logged in to do that!");
        res.redirect("/login");
    }

};

module.exports = middleware;