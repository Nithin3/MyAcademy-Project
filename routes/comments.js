//==============
//comment routes
//==============
var express = require("express");
var router = express.Router({mergeParama:true});
var Cricketcamp = require("../models/cricketcamp.js");
var Comment = require("../models/comment.js");
var middleware = require("../middleware/index.js");

//comments new
router.get("/cricketcamps/:id/comments/new",middleware.isLoggedIn,function(req, res) {
   Cricketcamp.findById(req.params.id,function(err,foundCricketcamp){
      if(err){
          console.log(err);
      }else{
           res.render("comments/new",{cricketcamp:foundCricketcamp}); 
      } 
   });
  
});

//comments create
router.post("/cricketcamps/:id/comments",middleware.isLoggedIn,function(req,res){
   Cricketcamp.findById(req.params.id,function(err,foundCricketcamp){
       if(err){
           console.log(err);
       }else{
           Comment.create(req.body.comment,function(err,comment){
               if(err){
                   req.flash("error","Something went wrong");
                   console.log(err);
               }else{
                   //add username and id and then save comment
                   comment.author.id = req.user._id;
                   comment.author.username = req.user.username;
                   comment.save();
                   foundCricketcamp.comments.push(comment);
                   foundCricketcamp.save();
                   req.flash("success","Succesfully added the comment!");
                   res.redirect("/cricketcamps/"+req.params.id);
               }
           });
       }
   });
});

//comment edit route
router.get("/cricketcamps/:id/comments/:comment_id/edit",middleware.ensureCommentOwnership,function(req,res){
    
            Comment.findById(req.params.comment_id,function(err, foundComment) {
                if(err){
                    res.redirect("back");
                }else{
                    res.render("comments/edit",{cricketcamp_id:req.params.id, comment: foundComment}); 
                }
            });
        
});

//comment update
router.put("/cricketcamps/:id/comments/:comment_id",middleware.ensureCommentOwnership,function(req,res){
   Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,updatedComment){
       if(err){
           res.redirect("back");
       }else{
           res.redirect("/cricketcamps/"+req.params.id);
       }
   }); 
});

//delete comment route
router.delete("/cricketcamps/:id/comments/:comment_id",middleware.ensureCommentOwnership,function(req,res){
   Comment.findByIdAndRemove(req.params.comment_id, function(err){
       if(err){
           console.log(err);
       }else{
            req.flash("success","Comment successfully deleted!");
           res.redirect("/cricketcamps/"+req.params.id);
       }
   });
});

//middleware

module.exports = router;
